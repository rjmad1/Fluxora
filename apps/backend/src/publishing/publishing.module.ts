import { Module } from '@nestjs/common';
import { SocialAdaptersService } from './adapters.service';
import { PublishActivities } from './publish.activities';
import { TokenRefreshActivities } from './token-refresh.activities';
import { SecretsModule } from '../secrets/secrets.module';
import { PublishController } from './publish.controller';
import { ApprovalController } from './approval.controller';

@Module({
  imports: [SecretsModule],
  providers: [SocialAdaptersService, PublishActivities, TokenRefreshActivities],
  controllers: [PublishController, ApprovalController],
  exports: [SocialAdaptersService, PublishActivities, TokenRefreshActivities],
})
export class PublishingModule {}
