import { Module } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { PersonalProfileService } from './personal-profile.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { DigitalTwinService } from './digital-twin.service';
import { IngestionService } from './ingestion.service';
import { PersonalHubController } from './personal-hub.controller';

@Module({
  providers: [
    PrismaService,
    TenantService,
    PersonalProfileService,
    KnowledgeGraphService,
    DigitalTwinService,
    IngestionService,
  ],
  controllers: [PersonalHubController],
  exports: [
    PersonalProfileService,
    KnowledgeGraphService,
    DigitalTwinService,
    IngestionService,
  ],
})
export class PersonalHubModule {}
