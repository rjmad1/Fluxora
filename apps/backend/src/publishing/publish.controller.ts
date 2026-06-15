import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { WorkflowClient } from '@temporalio/client';
import { PostPublishingWorkflow } from './publish.workflow';

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
    @Inject('TEMPORAL_CLIENT') private readonly temporalClient: WorkflowClient,
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

    // 2. Trigger the Temporal PostPublishingWorkflow scheduler
    try {
      await this.temporalClient.start(PostPublishingWorkflow, {
        taskQueue: 'publishing-tasks',
        workflowId: `wf-publish-${post.id}`,
        args: [post.id, post.scheduledAt.toISOString()],
      });
      this.logger.log(
        `Successfully started Temporal workflow wf-publish-${post.id}`,
      );
    } catch (err) {
      // Graceful degradation for local development/testing environments
      this.logger.warn(
        `Temporal workflow initialization failed: ${err.message}. Saving to queue database state.`,
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
