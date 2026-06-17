import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'publishing-tasks',
    }),
    AnalyticsModule,
  ],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
