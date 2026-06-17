import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { WebhooksController } from './webhooks.controller';
import { NotificationsController } from './notifications.controller';
import { BullModule } from '@nestjs/bullmq';
import { WebhookDispatchProcessor } from './webhook-dispatch.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook-delivery',
    }),
  ],
  controllers: [WebhooksController, NotificationsController],
  providers: [NotificationsService, WebhookDispatchProcessor],
  exports: [NotificationsService, BullModule],
})
export class NotificationsModule {}
