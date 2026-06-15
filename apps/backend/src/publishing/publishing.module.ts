import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SocialAdaptersService } from './adapters.service';
import { PublishActivities } from './publish.activities';
import { TokenRefreshActivities } from './token-refresh.activities';
import { SecretsModule } from '../secrets/secrets.module';
import { PublishController } from './publish.controller';
import { ApprovalController } from './approval.controller';
import { PublishProcessor } from './publish.processor';

@Module({
  imports: [
    SecretsModule,
    BullModule.registerQueue({
      name: 'publishing-tasks',
    }),
  ],
  providers: [
    SocialAdaptersService,
    PublishActivities,
    TokenRefreshActivities,
    PublishProcessor,
  ],
  controllers: [PublishController, ApprovalController],
  exports: [SocialAdaptersService, PublishActivities, TokenRefreshActivities],
})
export class PublishingModule {}
