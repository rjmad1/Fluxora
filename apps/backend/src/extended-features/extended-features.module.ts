import { Module } from '@nestjs/common';
import { ExtendedFeaturesController } from './extended-features.controller';
import { ExtendedFeaturesService } from './extended-features.service';
import { ExtendedFeaturesRepository } from './extended-features.repository';

@Module({
  controllers: [ExtendedFeaturesController],
  providers: [ExtendedFeaturesService, ExtendedFeaturesRepository],
  exports: [ExtendedFeaturesService, ExtendedFeaturesRepository],
})
export class ExtendedFeaturesModule {}
