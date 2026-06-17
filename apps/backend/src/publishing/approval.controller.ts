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
import { NotificationsService } from '../notifications/notifications.service';
import { TemporalService } from '../observability/temporal.service';
import axios from 'axios';

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
    private readonly notificationsService: NotificationsService,
    private readonly temporalService: TemporalService,
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
    const post = await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'PendingApproval' },
      include: { workspace: { include: { notificationSettings: true } } },
    });
    const token = generateToken(postId, post.workspaceId, this.getSecretKey());
    const portalUrl = `/approval/${token}`;

    const clientEmail = post.workspace.notificationSettings?.clientEmail;
    if (clientEmail) {
      const emailBody = `
        <p>A new post draft has been submitted for your approval in workspace <strong>${post.workspace.name}</strong>.</p>
        <p>Please review it here:</p>
        <p><a href="${portalUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; display: inline-block;">Review Post</a></p>
      `;
      await this.notificationsService.sendEmail(
        clientEmail,
        `Action Required: Approve Post Draft for ${post.workspace.name}`,
        emailBody,
        post.workspaceId,
      );
    }

    const slackUrl = post.workspace.notificationSettings?.slackWebhookUrl;
    if (slackUrl) {
      try {
        const fullPortalUrl = `http://localhost:3000/approval/${token}`;
        await axios.post(slackUrl, {
          text: `A new post draft requires approval in ${post.workspace.name}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Action Required: Approve Post Draft for ${post.workspace.name}*`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Content:*\n> ${post.content}`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Review & Approve',
                  },
                  url: fullPortalUrl,
                  style: 'primary',
                },
              ],
            },
          ],
        });
        this.logger.log(
          `Slack approval notification sent successfully for post ${postId}`,
        );
      } catch (slackErr: any) {
        this.logger.error(
          `Failed to send Slack webhook notification: ${slackErr.message}`,
        );
      }
    }

    return {
      token,
      portalUrl,
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

    // 2. Schedule publishing in Temporal or BullMQ if approved
    if (action === 'approve') {
      try {
        const delayMs = Math.max(0, post.scheduledAt.getTime() - Date.now());
        if (this.temporalService.getIsTemporalActive()) {
          const client = this.temporalService.getClient();
          if (client) {
            await client.workflow.start('postPublishingWorkflow', {
              args: [post.id, post.scheduledAt.toISOString()],
              taskQueue: 'publishing-tasks',
              workflowId: `wf-publish-${post.id}`,
            });
            this.logger.log(
              `Successfully scheduled Temporal workflow for approved post ${post.id} with delay ${delayMs}ms`,
            );
          }
        } else {
          await this.publishingQueue.add(
            'publish-post',
            { postId: post.id },
            { delay: delayMs, jobId: `job-publish-${post.id}` },
          );
          this.logger.log(
            `Successfully scheduled BullMQ job for approved post ${post.id} with delay ${delayMs}ms`,
          );
        }
      } catch (err) {
        this.logger.error(
          `Job scheduling failed for approved post ${post.id}: ${err.message}`,
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

    // Notify creator
    if (post.createdByEmail) {
      const decisionSubject = `Post ${post.id} has been ${post.status === 'Scheduled' ? 'Approved' : 'Rejected'}`;
      const decisionBody = `
        <p>Your post draft in workspace <strong>${post.workspace.name}</strong> has been ${post.status === 'Scheduled' ? '<strong>Approved</strong>' : '<strong>Rejected</strong>'} by the client.</p>
        ${post.feedback ? `<p><strong>Feedback comments:</strong> ${post.feedback}</p>` : ''}
      `;
      await this.notificationsService.sendEmail(
        post.createdByEmail,
        decisionSubject,
        decisionBody,
        post.workspaceId,
      );
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

    // 2. Schedule publishing in Temporal or BullMQ if approved
    if (action === 'approve') {
      try {
        const delayMs = Math.max(0, post.scheduledAt.getTime() - Date.now());
        if (this.temporalService.getIsTemporalActive()) {
          const client = this.temporalService.getClient();
          if (client) {
            await client.workflow.start('postPublishingWorkflow', {
              args: [post.id, post.scheduledAt.toISOString()],
              taskQueue: 'publishing-tasks',
              workflowId: `wf-publish-${post.id}`,
            });
            this.logger.log(
              `Successfully scheduled Temporal workflow for approved post ${post.id} with delay ${delayMs}ms`,
            );
          }
        } else {
          await this.publishingQueue.add(
            'publish-post',
            { postId: post.id },
            { delay: delayMs, jobId: `job-publish-${post.id}` },
          );
          this.logger.log(
            `Successfully scheduled BullMQ job for approved post ${post.id} with delay ${delayMs}ms`,
          );
        }
      } catch (err) {
        this.logger.error(
          `Job scheduling failed for approved post ${post.id}: ${err.message}`,
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

    // Notify creator
    if (post.createdByEmail) {
      const decisionSubject = `Post ${post.id} has been ${post.status === 'Scheduled' ? 'Approved' : 'Rejected'}`;
      const decisionBody = `
        <p>Your post draft in workspace <strong>${post.workspace.name}</strong> has been ${post.status === 'Scheduled' ? '<strong>Approved</strong>' : '<strong>Rejected</strong>'}.</p>
      `;
      await this.notificationsService.sendEmail(
        post.createdByEmail,
        decisionSubject,
        decisionBody,
        post.workspaceId,
      );
    }

    return {
      id: post.id,
      status: post.status,
      actionExecuted: action,
    };
  }
}
