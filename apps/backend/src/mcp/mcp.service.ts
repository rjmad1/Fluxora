import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TemporalService } from '../observability/temporal.service';
import { ClickHouseService } from '../analytics/clickhouse.service';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly temporalService: TemporalService,
    private readonly clickhouseService: ClickHouseService,
    @InjectQueue('publishing-tasks') private readonly publishingQueue: Queue,
  ) {}

  async handleJsonRpc(request: any, workspaceId: string): Promise<any> {
    const { jsonrpc, method, params, id } = request;

    if (jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request: Expected JSON-RPC 2.0',
        },
        id: id || null,
      };
    }

    try {
      switch (method) {
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            result: {
              tools: this.getAvailableTools(),
            },
            id,
          };

        case 'tools/call': {
          if (!params || !params.name) {
            return {
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid params: Missing tool name',
              },
              id,
            };
          }
          const toolResult = await this.executeTool(
            params.name,
            params.arguments || {},
            workspaceId,
          );
          return {
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2),
                },
              ],
            },
            id,
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id,
          };
      }
    } catch (err: any) {
      this.logger.error(`MCP Error executing method ${method}: ${err.message}`);
      return {
        jsonrpc: '2.0',
        error: { code: -32603, message: `Internal error: ${err.message}` },
        id,
      };
    }
  }

  private getAvailableTools() {
    return [
      {
        name: 'fluxora:list_posts',
        description:
          'Retrieves all scheduled, draft, or published posts in the current workspace.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'fluxora:create_post',
        description: 'Creates and schedules a new post and its variants.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The main textual content of the post.',
            },
            scheduledAt: {
              type: 'string',
              description:
                'ISO-8601 date string when the post should be published (e.g. 2026-06-18T10:00:00Z).',
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Target platforms (e.g. ["linkedin", "twitter", "facebook", "instagram", "tiktok"]).',
            },
          },
          required: ['content', 'scheduledAt', 'platforms'],
        },
      },
      {
        name: 'fluxora:delete_post',
        description: 'Cancels and deletes a scheduled post by its database ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The database UUID of the post to delete.',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'fluxora:fetch_analytics_metrics',
        description:
          'Retrieves aggregated views, clicks, and shares metrics from the ClickHouse analytics engine.',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'ISO-8601 start date (default: 30 days ago)',
            },
            endDate: {
              type: 'string',
              description: 'ISO-8601 end date (default: now)',
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Optional filter for platforms (e.g. ["linkedin", "twitter", "facebook"])',
            },
          },
        },
      },
    ];
  }

  private async executeTool(
    name: string,
    args: any,
    workspaceId: string,
  ): Promise<any> {
    this.logger.log(
      `Executing tool ${name} with arguments: ${JSON.stringify(args)}`,
    );

    switch (name) {
      case 'fluxora:list_posts':
        return this.prisma.runInWorkspace(async (tx) => {
          return tx.post.findMany({
            where: { workspaceId },
            include: { variants: true },
            orderBy: { scheduledAt: 'desc' },
          });
        });

      case 'fluxora:create_post': {
        const { content, scheduledAt, platforms } = args;
        if (!content || !scheduledAt || !platforms) {
          throw new Error('Missing arguments: content, scheduledAt, platforms');
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          throw new Error('Invalid scheduledAt date format');
        }

        const post = await this.prisma.runInWorkspace(async (tx) => {
          return tx.post.create({
            data: {
              workspaceId,
              content,
              scheduledAt: scheduledDate,
              status: 'Scheduled',
              variants: {
                create: (platforms as string[]).map((plat) => ({
                  platform: plat,
                  overrideContent: null,
                  assetUrls: [],
                })),
              },
            },
            include: { variants: true },
          });
        });

        // Stagger/enqueue tasks
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
            }
          } else {
            await this.publishingQueue.add(
              'publish-post',
              { postId: post.id },
              { delay: delayMs, jobId: `job-publish-${post.id}` },
            );
          }
        } catch (err: any) {
          this.logger.error(`Failed to register job in queue: ${err.message}`);
        }

        return {
          message: 'Post successfully scheduled via MCP',
          post,
        };
      }

      case 'fluxora:delete_post': {
        const { id } = args;
        if (!id) throw new Error('Missing argument: id');

        const postExists = await this.prisma.runInWorkspace(async (tx) => {
          return tx.post.findFirst({
            where: { id, workspaceId },
          });
        });

        if (!postExists) {
          throw new Error(`Post ${id} not found in this workspace context`);
        }

        // Cancel jobs
        try {
          if (this.temporalService.getIsTemporalActive()) {
            const client = this.temporalService.getClient();
            if (client) {
              const handle = client.workflow.getHandle(`wf-publish-${id}`);
              await handle.terminate('MCP deleted');
            }
          } else {
            const job = await this.publishingQueue.getJob(`job-publish-${id}`);
            if (job) await job.remove();
          }
        } catch (err: any) {
          this.logger.warn(`Failed to terminate job: ${err.message}`);
        }

        await this.prisma.runInWorkspace(async (tx) => {
          return tx.post.delete({
            where: { id },
          });
        });

        return {
          message: `Post ${id} successfully deleted`,
          success: true,
        };
      }

      case 'fluxora:fetch_analytics_metrics': {
        const { startDate, endDate, platforms: metricPlatforms } = args;
        const start = startDate
          ? new Date(startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const metricsList =
          await this.clickhouseService.queryTelemetryPerformance(
            workspaceId,
            start,
            end,
            metricPlatforms || ['linkedin', 'twitter', 'facebook'],
          );

        let totalViews = 0;
        let totalClicks = 0;
        let totalShares = 0;
        const breakdown: Record<
          string,
          { views: number; clicks: number; shares: number }
        > = {};

        metricsList.forEach((item) => {
          const platform = item.platform.toLowerCase();
          if (!breakdown[platform]) {
            breakdown[platform] = { views: 0, clicks: 0, shares: 0 };
          }

          if (item.eventType === 'post.impression') {
            totalViews += item.count;
            breakdown[platform].views += item.count;
          } else if (item.eventType === 'post.click') {
            totalClicks += item.count;
            breakdown[platform].clicks += item.count;
          } else if (item.eventType === 'post.share') {
            totalShares += item.count;
            breakdown[platform].shares += item.count;
          }
        });

        return {
          workspaceId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          summary: {
            views: totalViews,
            clicks: totalClicks,
            shares: totalShares,
          },
          breakdown,
        };
      }

      default:
        throw new Error(`Unsupported tool: ${name}`);
    }
  }
}
