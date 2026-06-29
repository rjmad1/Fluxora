import { Module } from '@nestjs/common';
import { ExtendedFeaturesController } from './extended-features.controller';
import { ExtendedFeaturesService } from './extended-features.service';
import { ExtendedFeaturesRepository } from './extended-features.repository';
import { TenantModule } from '../tenant/tenant.module';
import { ObservabilityModule } from '../observability/observability.module';
import { MockMentionProvider } from './listening.provider';

@Module({
  imports: [TenantModule, ObservabilityModule],
  controllers: [ExtendedFeaturesController],
  providers: [
    ExtendedFeaturesService,
    ExtendedFeaturesRepository,
    { provide: 'ISocialListeningProvider', useClass: MockMentionProvider },
  ],
  exports: [ExtendedFeaturesService, ExtendedFeaturesRepository],
})
export class ExtendedFeaturesModule {}
