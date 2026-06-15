import { Module } from '@nestjs/common';
import { ClickHouseService } from './clickhouse.service';
import { KafkaConsumerService } from './kafka.consumer';
import { AnalyticsController } from './analytics.controller';

@Module({
  providers: [ClickHouseService, KafkaConsumerService],
  controllers: [AnalyticsController],
  exports: [ClickHouseService],
})
export class AnalyticsModule {}
