import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
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
    @InjectQueue('publishing-tasks') private readonly publishingQueue: Queue,
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

    // 2. Schedule publishing in BullMQ if approved
    if (action === 'approve') {
      try {
        const delayMs = Math.max(0, post.scheduledAt.getTime() - Date.now());
        await this.publishingQueue.add(
          'publish-post',
          { postId: post.id },
          { delay: delayMs, jobId: `job-publish-${post.id}` },
        );
        this.logger.log(
          `Successfully scheduled BullMQ job for approved post ${post.id} with delay ${delayMs}ms`,
        );
      } catch (err) {
        this.logger.error(
          `BullMQ job scheduling failed for approved post ${post.id}: ${err.message}`,
        );
      }
    }

    // 3. Write Telemetry Event
    try {
      await this.prisma.telemetryEvent.create({
        data: {
          workspaceId: post.workspaceId,
          postId: post.id,
          platform: 'all',
          eventType:
            action === 'approve' ? 'approval.granted' : 'approval.rejected',
        },
      });
    } catch (dbError) {
      this.logger.error(`Telemetry persistence failed: ${dbError.message}`);
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

    // 2. Schedule publishing in BullMQ if approved
    if (action === 'approve') {
      try {
        const delayMs = Math.max(0, post.scheduledAt.getTime() - Date.now());
        await this.publishingQueue.add(
          'publish-post',
          { postId: post.id },
          { delay: delayMs, jobId: `job-publish-${post.id}` },
        );
        this.logger.log(
          `Successfully scheduled BullMQ job for approved post ${post.id} with delay ${delayMs}ms`,
        );
      } catch (err) {
        this.logger.error(
          `BullMQ job scheduling failed for approved post ${post.id}: ${err.message}`,
        );
      }
    }

    // 3. Write Telemetry Event
    try {
      await this.prisma.telemetryEvent.create({
        data: {
          workspaceId: post.workspaceId,
          postId: post.id,
          platform: 'all',
          eventType:
            action === 'approve' ? 'approval.granted' : 'approval.rejected',
        },
      });
    } catch (dbError) {
      this.logger.error(`Telemetry persistence failed: ${dbError.message}`);
    }

    return {
      id: post.id,
      status: post.status,
      actionExecuted: action,
    };
  }
}
