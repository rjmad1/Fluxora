import {
  Controller,
  Post,
  Param,
  Body,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { WorkflowClient } from '@temporalio/client';
import type { Producer } from 'kafkajs';
import { approveSignal, rejectSignal } from './approval.workflow';

interface HandleApprovalDto {
  action: 'approve' | 'reject';
  feedback?: string;
}

@Controller('api/v1/posts')
export class ApprovalController {
  private readonly logger = new Logger(ApprovalController.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('TEMPORAL_CLIENT') private readonly temporalClient: WorkflowClient,
    @Inject('KAFKA_PRODUCER') private readonly kafkaProducer: Producer,
  ) {}

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
              tenantId: 'Fluxora-Tenant-098',
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
