import { Module } from '@nestjs/common';
import { BrandComplianceService } from './brand-compliance.service';

@Module({
  providers: [BrandComplianceService],
  exports: [BrandComplianceService],
})
export class AIModule {}
