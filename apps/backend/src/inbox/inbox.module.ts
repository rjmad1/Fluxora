import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { WebhookController } from './webhook.controller';
import { InboxService } from './inbox.service';
import { InboxGateway } from './inbox.gateway';
import { ObservabilityModule } from '../observability/observability.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [ObservabilityModule, TenantModule],
  controllers: [InboxController, WebhookController],
  providers: [InboxService, InboxGateway],
  exports: [InboxService],
})
export class InboxModule {}
