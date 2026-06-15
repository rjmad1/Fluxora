import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('performance')
  async getPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('platforms') platforms?: string, // Comma separated platforms
  ) {
    const workspaceId = this.tenantService.getWorkspaceId();

    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const platformList = platforms
      ? platforms.split(',').map((p) => p.trim())
      : undefined;

    // Query telemetry aggregations from PostgreSQL using Prisma
    const rawMetrics = await this.prisma.telemetryEvent.groupBy({
      by: ['platform', 'eventType'],
      where: {
        workspaceId,
        timestamp: {
          gte: start,
          lte: end,
        },
        ...(platformList ? { platform: { in: platformList } } : {}),
      },
      _count: {
        _all: true,
      },
    });

    // Format metrics into contract structure
    let totalViews = 0;
    let totalClicks = 0;
    let totalShares = 0;
    const byPlatform: Record<
      string,
      { views: number; clicks: number; shares?: number }
    > = {};

    rawMetrics.forEach((row) => {
      const platform = (row.platform || 'unknown').toLowerCase();
      const eventType = (row.eventType || '').toLowerCase();
      const count = Number(row._count._all || 0);

      if (!byPlatform[platform]) {
        byPlatform[platform] = { views: 0, clicks: 0, shares: 0 };
      }

      if (
        eventType === 'post.impression' ||
        eventType === 'post.dispatched' ||
        eventType === 'post.publishing'
      ) {
        byPlatform[platform].views += count;
        totalViews += count;
      } else if (eventType === 'post.click') {
        byPlatform[platform].clicks += count;
        totalClicks += count;
      } else if (eventType === 'post.share') {
        byPlatform[platform].shares =
          (byPlatform[platform].shares || 0) + count;
        totalShares += count;
      }
    });

    return {
      views: totalViews,
      clicks: totalClicks,
      shares: totalShares,
      byPlatform,
    };
  }
}
