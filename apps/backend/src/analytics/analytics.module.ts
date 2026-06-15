import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ClickHouseService } from './clickhouse.service';
import { TelemetryConsumer } from './telemetry.consumer';
import { EventPipelineService } from './event-pipeline.service';

@Module({
  providers: [ClickHouseService, TelemetryConsumer, EventPipelineService],
  controllers: [AnalyticsController],
  exports: [ClickHouseService, TelemetryConsumer, EventPipelineService],
})
export class AnalyticsModule {}
