import { Module } from '@nestjs/common';
import { ExtendedFeaturesController } from './extended-features.controller';
import { ExtendedFeaturesService } from './extended-features.service';

@Module({
  controllers: [ExtendedFeaturesController],
  providers: [ExtendedFeaturesService],
  exports: [ExtendedFeaturesService],
})
export class ExtendedFeaturesModule {}
