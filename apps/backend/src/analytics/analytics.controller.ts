import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ClickHouseService } from './clickhouse.service';
import { TenantService } from '../tenant/tenant.service';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    private readonly clickHouseService: ClickHouseService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('performance')
  async getPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('platforms') platforms?: string, // Comma separated platforms
  ) {
    const tenantId = this.tenantService.getTenantId();
    const workspaceId = this.tenantService.getWorkspaceId();

    if (!tenantId || !workspaceId) {
      throw new BadRequestException(
        'Missing active tenant/workspace context headers',
      );
    }

    // Default dates if none provided
    const start = startDate
      ? new Date(startDate).toISOString().replace('T', ' ').substring(0, 19)
      : '1970-01-01 00:00:00';
    const end = endDate
      ? new Date(endDate).toISOString().replace('T', ' ').substring(0, 19)
      : new Date().toISOString().replace('T', ' ').substring(0, 19);

    const params: Record<string, string> = {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      start,
      end,
    };

    let platformFilter = '';
    if (platforms) {
      const platformList = platforms.split(',').map((p) => p.trim());
      const platformPlaceholders = platformList
        .map((_, idx) => {
          const paramKey = `platform_${idx}`;
          params[paramKey] = platformList[idx];
          return `{${paramKey}:String}`;
        })
        .join(',');
      platformFilter = `AND platform IN (${platformPlaceholders})`;
    }

    // Query telemetry aggregations from ClickHouse securely using parameters
    const sqlQuery = `
      SELECT platform, event_type, count(*) as cnt
      FROM telemetry_events
      WHERE tenant_id = {tenant_id:String}
        AND workspace_id = {workspace_id:String}
        AND timestamp >= {start:DateTime}
        AND timestamp <= {end:DateTime}
        ${platformFilter}
      GROUP BY platform, event_type
    `;

    const rawMetrics = await this.clickHouseService.executeQuery(
      sqlQuery,
      params,
    );

    // Format metrics into contract structure
    let totalViews = 0;
    let totalClicks = 0;
    let totalShares = 0;
    const byPlatform: Record<
      string,
      { views: number; clicks: number; shares?: number }
    > = {};

    rawMetrics.forEach((row: any) => {
      const platform = (row.platform || 'unknown').toLowerCase();
      const eventType = (row.event_type || '').toLowerCase();
      const count = Number(row.cnt || 0);

      if (!byPlatform[platform]) {
        byPlatform[platform] = { views: 0, clicks: 0, shares: 0 };
      }

      if (eventType === 'post.impression' || eventType === 'post.dispatched') {
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
