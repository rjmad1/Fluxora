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

const INSECURE_DEFAULT_KEY = 'fluxora-client-portal-secret-key-change-me-in-production';
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours — FR-005: short-lived

function generateToken(
  postId: string,
  workspaceId: string,
  secretKey: string,
): string {
  const payload = { postId, workspaceId, expiresAt: Date.now() + TOKEN_TTL_MS };
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
    const receivedSig = parts[1];
    const expectedSig = crypto
      .createHmac('sha256', secretKey)
      .update(payloadStr)
      .digest('hex');
    // Use constant-time comparison to prevent timing-oracle attacks
    const receivedBuf = Buffer.from(receivedSig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (
      receivedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      return null;
    }
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
    const key = this.configService.get<string>('PORTAL_SECRET_KEY', INSECURE_DEFAULT_KEY);
    if (key === INSECURE_DEFAULT_KEY && process.env.NODE_ENV === 'production') {
      throw new Error(
        'PORTAL_SECRET_KEY must be set to a strong secret in production. ' +
          'Generate one with: openssl rand -hex 32',
      );
    }
    if (key === INSECURE_DEFAULT_KEY) {
      this.logger.warn(
        'PORTAL_SECRET_KEY is using the insecure default. Set it via environment variable.',
      );
    }
    return key;
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

    // Single-use enforcement: reject if the post has already been actioned
    const currentPost = await this.prisma.post.findUnique({
      where: { id: payload.postId },
      select: { status: true },
    });
    if (!currentPost) {
      throw new BadRequestException('Post not found');
    }
    if (currentPost.status !== 'PendingApproval') {
      throw new BadRequestException(
        'This approval link has already been used or the post is no longer awaiting approval.',
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

    // 2. Schedule publishing — Temporal primary, BullMQ resilient fallback
    if (action === 'approve') {
      const delayMs = Math.max(0, post.scheduledAt.getTime() - Date.now());
      let scheduledViaTemporal = false;

      if (this.temporalService.getIsTemporalActive()) {
        const client = this.temporalService.getClient();
        if (client) {
          try {
            await client.workflow.start('postPublishingWorkflow', {
              args: [post.id, post.scheduledAt.toISOString()],
              taskQueue: 'publishing-tasks',
              workflowId: `wf-publish-${post.id}`,
            });
            scheduledViaTemporal = true;
            this.logger.log(
              `Temporal workflow scheduled for approved post ${post.id} (delay ${delayMs}ms)`,
            );
          } catch (temporalErr) {
            this.logger.warn(
              `Temporal scheduling failed for post ${post.id}, falling back to BullMQ: ${temporalErr.message}`,
            );
          }
        }
      }

      if (!scheduledViaTemporal) {
        try {
          await this.publishingQueue.add(
            'publish-post',
            { postId: post.id },
            { delay: delayMs, jobId: `job-publish-${post.id}` },
          );
          this.logger.log(
            `BullMQ job scheduled for approved post ${post.id} (delay ${delayMs}ms)`,
          );
        } catch (bullErr) {
          this.logger.error(
            `BullMQ scheduling also failed for post ${post.id}: ${bullErr.message}`,
          );
        }
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

}
// NOTE: The former `POST :id/approval` endpoint was removed.
// It accepted approval actions by postId alone with no token verification —
// any caller who knew a postId could approve or reject a client campaign post.
// All approval actions must go through `POST approval/submit?token=<signed-token>`.
