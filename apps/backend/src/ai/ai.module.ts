import { Module } from '@nestjs/common';
import { BrandComplianceService } from './brand-compliance.service';
import { PersonalContextEngineService } from './personal-context-engine.service';
import { PersonalHubModule } from '../personal-hub/personal-hub.module';
import { AIController } from './ai.controller';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { TenantModule } from '../tenant/tenant.module'; // Import TenantModule for Prisma dependency
import { ObservabilityModule } from '../observability/observability.module'; // Import ObservabilityModule for Kafka dependency

@Module({
  imports: [PersonalHubModule, TenantModule, ObservabilityModule],
  controllers: [AIController],
  providers: [
    BrandComplianceService,
    PersonalContextEngineService,
    OrganizationalMemoryService,
    AgentOrchestratorService,
  ],
  exports: [
    BrandComplianceService,
    PersonalContextEngineService,
    OrganizationalMemoryService,
    AgentOrchestratorService,
  ],
})
export class AIModule {}
