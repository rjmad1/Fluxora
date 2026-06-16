import { Module } from '@nestjs/common';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';
import { TenantModule } from '../../tenant/tenant.module';
import { ExtendedFeaturesModule } from '../../extended-features/extended-features.module';

@Module({
  imports: [TenantModule, ExtendedFeaturesModule],
  controllers: [ListeningController],
  providers: [ListeningService],
  exports: [ListeningService],
})
export class ListeningModule {}
