import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

interface CreatePostVariantDto {
  platform: string;
  overrideContent?: string;
  assetUrls?: string[];
}

interface CreatePostDto {
  content: string;
  scheduledAt: string;
  variants?: CreatePostVariantDto[];
}

@Controller('api/v1/posts')
export class PublishController {
  private readonly logger = new Logger(PublishController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @InjectQueue('publishing-tasks') private readonly publishingQueue: Queue,
  ) {}

  @Post()
  async schedulePost(@Body() dto: CreatePostDto) {
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

    // 2. Trigger the BullMQ publishing task
    try {
      const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
      await this.publishingQueue.add(
        'publish-post',
        { postId: post.id },
        { delay: delayMs, jobId: `job-publish-${post.id}` },
      );
      this.logger.log(
        `Successfully scheduled BullMQ job for post ${post.id} with delay ${delayMs}ms`,
      );
    } catch (err) {
      this.logger.error(
        `BullMQ job scheduling failed for post ${post.id}: ${err.message}`,
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
}
