import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { TemporalService } from '../observability/temporal.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';

interface UpdatePostVariantDto {
  platform: string;
  overrideContent?: string;
  assetUrls?: string[];
}

interface UpdatePostDto {
  content: string;
  scheduledAt: string;
  variants?: UpdatePostVariantDto[];
}

@Controller('api/v1/calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly temporalService: TemporalService,
    @InjectQueue('publishing-tasks') private readonly publishingQueue: Queue,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('posts')
  async schedulePost(@Body() dto: UpdatePostDto) {
    const { content, scheduledAt, variants } = dto;
    if (!content || !scheduledAt) {
      throw new BadRequestException(
        'Missing required fields: content, scheduledAt',
      );
    }

    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid scheduledAt ISO date format');
    }

    // 1. Create the post and its variants in PostgreSQL within the active workspace context
    const post = await this.prisma.runInWorkspace(async (tx) => {
      return tx.post.create({
        data: {
          workspaceId,
          content,
          scheduledAt: scheduledDate,
          status: 'Scheduled',
          variants: {
            create: (variants || []).map((v) => ({
              platform: v.platform,
              overrideContent: v.overrideContent || null,
              assetUrls: v.assetUrls || [],
            })),
          },
        },
      });
    });

    // 2. Trigger the BullMQ publishing task or Temporal workflow
    try {
      const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
      if (this.temporalService.getIsTemporalActive()) {
        const client = this.temporalService.getClient();
        if (client) {
          await client.workflow.start('postPublishingWorkflow', {
            args: [post.id, scheduledDate.toISOString()],
            taskQueue: 'publishing-tasks',
            workflowId: `wf-publish-${post.id}`,
          });
          this.logger.log(
            `Successfully scheduled Temporal workflow for post ${post.id} with delay ${delayMs}ms`,
          );
        }
      } else {
        await this.publishingQueue.add(
          'publish-post',
          { postId: post.id },
          { delay: delayMs, jobId: `job-publish-${post.id}` },
        );
        this.logger.log(
          `Successfully scheduled BullMQ job for post ${post.id} with delay ${delayMs}ms`,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Job scheduling failed for post ${post.id}: ${err.message}`,
      );
    }

    // Trigger post.created webhook
    try {
      void this.notificationsService.dispatchWebhook(
        workspaceId,
        'post.created',
        {
          id: post.id,
          content: post.content,
          scheduledAt: post.scheduledAt.toISOString(),
          status: post.status,
        },
      );
    } catch (whErr: any) {
      this.logger.error(
        `Webhook post.created dispatch failed: ${whErr.message}`,
      );
    }

    return {
      id: post.id,
      content: post.content,
      scheduledAt: post.scheduledAt.toISOString(),
      status: post.status,
      createdAt: post.createdAt.toISOString(),
    };
  }

  @Get()
  async getCalendarItems() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    return this.prisma.runInWorkspace(async (tx) => {
      return tx.post.findMany({
        where: { workspaceId },
        include: { variants: true },
        orderBy: { scheduledAt: 'asc' },
      });
    });
  }

  @Put(':id')
  async reschedulePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const { content, scheduledAt, variants } = dto;
    if (!content || !scheduledAt) {
      throw new BadRequestException(
        'Missing required fields: content, scheduledAt',
      );
    }

    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid scheduledAt ISO date format');
    }

    // 1. Verify post ownership
    const post = await this.prisma.runInWorkspace(async (tx) => {
      return tx.post.findFirst({
        where: { id, workspaceId },
      });
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${id} not found in this workspace`,
      );
    }

    // 2. Terminate/remove scheduled queue jobs
    try {
      if (this.temporalService.getIsTemporalActive()) {
        const client = this.temporalService.getClient();
        if (client) {
          const handle = client.workflow.getHandle(`wf-publish-${id}`);
          await handle.terminate('Post rescheduled via calendar');
        }
      } else {
        const job = await this.publishingQueue.getJob(`job-publish-${id}`);
        if (job) {
          await job.remove();
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to terminate/remove old job: ${err.message}`);
    }

    // 3. Update in DB (replace variants)
    const updatedPost = await this.prisma.runInWorkspace(async (tx) => {
      await tx.postVariant.deleteMany({
        where: { postId: id },
      });

      return tx.post.update({
        where: { id },
        data: {
          content,
          scheduledAt: scheduledDate,
          status: 'Scheduled',
          variants: {
            create: (variants || []).map((v) => ({
              platform: v.platform,
              overrideContent: v.overrideContent || null,
              assetUrls: v.assetUrls || [],
            })),
          },
        },
        include: { variants: true },
      });
    });

    // 4. Schedule new queue job
    try {
      const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
      if (this.temporalService.getIsTemporalActive()) {
        const client = this.temporalService.getClient();
        if (client) {
          await client.workflow.start('postPublishingWorkflow', {
            args: [updatedPost.id, scheduledDate.toISOString()],
            taskQueue: 'publishing-tasks',
            workflowId: `wf-publish-${updatedPost.id}`,
          });
        }
      } else {
        await this.publishingQueue.add(
          'publish-post',
          { postId: updatedPost.id },
          { delay: delayMs, jobId: `job-publish-${updatedPost.id}` },
        );
      }
    } catch (err: any) {
      this.logger.error(`Rescheduling task queue entry failed: ${err.message}`);
    }

    return updatedPost;
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const post = await this.prisma.runInWorkspace(async (tx) => {
      return tx.post.findFirst({
        where: { id, workspaceId },
      });
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${id} not found in this workspace`,
      );
    }

    // 1. Remove scheduled job
    try {
      if (this.temporalService.getIsTemporalActive()) {
        const client = this.temporalService.getClient();
        if (client) {
          const handle = client.workflow.getHandle(`wf-publish-${id}`);
          await handle.terminate('Post deleted via calendar');
        }
      } else {
        const job = await this.publishingQueue.getJob(`job-publish-${id}`);
        if (job) {
          await job.remove();
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to terminate/remove job on delete: ${err.message}`,
      );
    }

    // 2. Delete from DB
    await this.prisma.runInWorkspace(async (tx) => {
      return tx.post.delete({
        where: { id },
      });
    });

    return { success: true };
  }
}
