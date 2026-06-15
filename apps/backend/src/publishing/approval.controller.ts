import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { WorkflowClient } from '@temporalio/client';
import type { Producer } from 'kafkajs';
import { approveSignal, rejectSignal } from './approval.workflow';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

interface HandleApprovalDto {
  action: 'approve' | 'reject';
  feedback?: string;
}

function generateToken(
  postId: string,
  workspaceId: string,
  secretKey: string,
): string {
  const payload = {
    postId,
    workspaceId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiry
  };
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payloadStr)
    .digest('hex');
  return Buffer.from(payloadStr).toString('base64') + '.' + signature;
}

function verifyToken(
  token: string,
  secretKey: string,
): { postId: string; workspaceId: string; expiresAt: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadStr = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = parts[1];
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payloadStr)
      .digest('hex');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

@Controller('api/v1/posts')
export class ApprovalController {
  private readonly logger = new Logger(ApprovalController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject('TEMPORAL_CLIENT') private readonly temporalClient: WorkflowClient,
    @Inject('KAFKA_PRODUCER') private readonly kafkaProducer: Producer,
  ) {}

  private getSecretKey(): string {
    return this.configService.get<string>(
      'PORTAL_SECRET_KEY',
      'fluxora-client-portal-secret-key-change-me-in-production',
    );
  }

  @Post(':id/approval-token')
  async getApprovalToken(@Param('id') postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    const token = generateToken(postId, post.workspaceId, this.getSecretKey());
    return {
      token,
      portalUrl: `/approval/${token}`,
    };
  }

  @Get('approval/validate')
  async validateApprovalToken(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    const payload = verifyToken(token, this.getSecretKey());
    if (!payload) {
      throw new BadRequestException('Invalid or expired token');
    }
    const post = await this.prisma.post.findUnique({
      where: { id: payload.postId },
      include: { variants: true },
    });
    if (!post) {
      throw new BadRequestException('Post not found');
    }
    return {
      postId: post.id,
      workspaceId: post.workspaceId,
      content: post.content,
      scheduledAt: post.scheduledAt,
      status: post.status,
      variants: post.variants,
    };
  }

  @Post('approval/submit')
  async submitApproval(
    @Query('token') token: string,
    @Body() dto: HandleApprovalDto,
  ) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    const payload = verifyToken(token, this.getSecretKey());
    if (!payload) {
      throw new BadRequestException('Invalid or expired token');
    }
    const { action, feedback } = dto;
    if (!action || (action !== 'approve' && action !== 'reject')) {
      throw new BadRequestException(
        'Invalid action: must be "approve" or "reject"',
      );
    }

    if (action === 'reject' && !feedback) {
      throw new BadRequestException(
        'Feedback is required when rejecting a post draft',
      );
    }

    // 1. Update Post Status in DB
    const newStatus = action === 'approve' ? 'Scheduled' : 'Rejected';
    const post = await this.prisma.post.update({
      where: { id: payload.postId },
      data: {
        status: newStatus,
        feedback: feedback || null,
      },
      include: { workspace: true },
    });

    // 2. Signal Temporal Workflow
    try {
      const handle = this.temporalClient.getHandle(
        `wf-approval-${payload.postId}`,
      );
      if (action === 'approve') {
        await handle.signal(approveSignal);
      } else {
        await handle.signal(rejectSignal, feedback || '');
      }
      this.logger.log(
        `Signaled Temporal workflow wf-approval-${payload.postId} with action: ${action}`,
      );
    } catch (err) {
      this.logger.warn(
        `Temporal signal failed: ${err.message}. Graceful mock simulation executed.`,
      );
    }

    // 3. Emit Kafka event
    try {
      await this.kafkaProducer.send({
        topic: 'fluxora.publishing.events',
        messages: [
          {
            key: payload.postId,
            value: JSON.stringify({
              eventId: `evt-${Math.random().toString(36).substring(2, 11)}`,
              eventType:
                action === 'approve' ? 'approval.granted' : 'approval.rejected',
              tenantId: post.workspace.tenantId,
              workspaceId: post.workspaceId,
              postId: payload.postId,
              feedback: feedback || null,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (kafkaError) {
      this.logger.error(`Kafka emission failed: ${kafkaError.message}`);
    }

    return {
      id: post.id,
      status: post.status,
      actionExecuted: action,
      feedback: post.feedback,
    };
  }

  @Post(':id/approval')
  async handleApprovalAction(
    @Param('id') postId: string,
    @Body() dto: HandleApprovalDto,
  ) {
    const { action, feedback } = dto;
    if (!action || (action !== 'approve' && action !== 'reject')) {
      throw new BadRequestException(
        'Invalid action: must be "approve" or "reject"',
      );
    }

    if (action === 'reject' && !feedback) {
      throw new BadRequestException(
        'Feedback is required when rejecting a post draft',
      );
    }

    // 1. Update Post Status in DB
    const newStatus = action === 'approve' ? 'Scheduled' : 'Rejected';
    const post = await this.prisma.post.update({
      where: { id: postId },
      data: { status: newStatus },
      include: { workspace: true },
    });

    // 2. Signal Temporal Workflow
    try {
      const handle = this.temporalClient.getHandle(`wf-approval-${postId}`);
      if (action === 'approve') {
        await handle.signal(approveSignal);
      } else {
        await handle.signal(rejectSignal, feedback || '');
      }
      this.logger.log(
        `Signaled Temporal workflow wf-approval-${postId} with action: ${action}`,
      );
    } catch (err) {
      this.logger.warn(
        `Temporal signal failed: ${err.message}. Graceful mock simulation executed.`,
      );
    }

    // 3. Emit Kafka events
    try {
      await this.kafkaProducer.send({
        topic: 'fluxora.publishing.events',
        messages: [
          {
            key: postId,
            value: JSON.stringify({
              eventId: `evt-${Math.random().toString(36).substring(2, 11)}`,
              eventType:
                action === 'approve' ? 'approval.granted' : 'approval.rejected',
              tenantId: post.workspace.tenantId,
              workspaceId: post.workspaceId,
              postId,
              feedback: feedback || null,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (kafkaError) {
      this.logger.error(`Kafka emission failed: ${kafkaError.message}`);
    }

    return {
      id: post.id,
      status: post.status,
      actionExecuted: action,
    };
  }
}
