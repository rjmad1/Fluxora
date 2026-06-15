import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

describe('OrganizationalMemoryService', () => {
  let service: OrganizationalMemoryService;
  const sandboxPath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'organizational-memory-sandbox.json',
  );

  const mockPrisma = {};
  const mockTenant = {};
  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => defaultVal),
  };

  beforeEach(async () => {
    // Clear sandbox
    if (fs.existsSync(sandboxPath)) {
      try {
        fs.unlinkSync(sandboxPath);
      } catch (err) {}
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationalMemoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantService, useValue: mockTenant },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<OrganizationalMemoryService>(OrganizationalMemoryService);
    service.onModuleInit();
  });

  it('should record campaign memories and calculate keyword embeddings', async () => {
    const doc = await service.recordMemory(
      'ws-mem-test',
      'CAMPAIGN',
      'Observability Campaign',
      'Focusing on high-throughput Kafka streaming telemetry database ClickHouse optimization.',
      { targets: 'DevOps' },
    );

    expect(doc).toBeDefined();
    expect(doc.id).toContain('mem-');
    expect(doc.embedding).toHaveLength(128); // 128 dimensions in mock
    expect(doc.metadata.targets).toBe('DevOps');

    // Semantic search should find this document when querying similar keywords
    const search = await service.searchMemories('ws-mem-test', 'Kafka telemetry');
    expect(search.length).toBeGreaterThanOrEqual(1);
    expect(search[0].document.id).toBe(doc.id);
    expect(search[0].similarity).toBeGreaterThan(0.5);
  });

  it('should construct graph nodes and edges for campaign target relationships', async () => {
    const doc = await service.recordMemory(
      'ws-mem-test',
      'CAMPAIGN',
      'Observability Campaign',
      'Focusing on high-throughput Kafka streaming telemetry.',
      { targets: 'DevOps' },
    );

    const related = await service.getRelatedEntities('ws-mem-test', doc.id);
    expect(related.node).toBeDefined();
    expect(related.edges).toHaveLength(1);
    expect(related.edges[0].relationshipType).toBe('TARGETS');
    expect(related.relatedNodes[0].name).toBe('DevOps');
  });
});
