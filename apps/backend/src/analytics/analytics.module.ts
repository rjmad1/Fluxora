import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ClickHouseService } from './clickhouse.service';
import { TelemetryConsumer } from './telemetry.consumer';

@Module({
  providers: [ClickHouseService, TelemetryConsumer],
  controllers: [AnalyticsController],
  exports: [ClickHouseService, TelemetryConsumer],
})
export class AnalyticsModule {}
