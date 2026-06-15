import { Module } from '@nestjs/common';
import { BrandComplianceService } from './brand-compliance.service';
import { PersonalContextEngineService } from './personal-context-engine.service';
import { PersonalHubModule } from '../personal-hub/personal-hub.module';
import { AIController } from './ai.controller';

@Module({
  imports: [PersonalHubModule],
  controllers: [AIController],
  providers: [BrandComplianceService, PersonalContextEngineService],
  exports: [BrandComplianceService, PersonalContextEngineService],
})
export class AIModule {}
