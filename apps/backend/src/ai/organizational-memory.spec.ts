import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';

describe('OrganizationalMemoryService', () => {
  let service: OrganizationalMemoryService;

  let mockDocuments: any[] = [];
  let mockNodes: any[] = [];
  let mockEdges: any[] = [];

  const mockPrisma = {
    memoryDocument: {
      count: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockDocuments.length)),
      create: jest.fn().mockImplementation(({ data }) => {
        const doc = {
          id: `mem-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: data.workspaceId,
          category: data.category,
          content: data.content,
          embedding: data.embedding,
          metadata: data.metadata || {},
          createdAt: new Date(),
        };
        mockDocuments.push(doc);
        return Promise.resolve(doc);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let docs = mockDocuments.filter(
          (d) => d.workspaceId === where.workspaceId,
        );
        if (where.category) {
          docs = docs.filter((d) => d.category === where.category);
        }
        return Promise.resolve(docs);
      }),
    },
    memoryNode: {
      create: jest.fn().mockImplementation(({ data }) => {
        const node = {
          id: data.id || `node-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: data.workspaceId,
          type: data.type,
          name: data.name,
          properties: data.properties || {},
          createdAt: new Date(),
        };
        mockNodes.push(node);
        return Promise.resolve(node);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const node = mockNodes.find(
          (n) =>
            n.workspaceId === where.workspaceId &&
            (where.id
              ? n.id === where.id
              : n.type === where.type && n.name === where.name),
        );
        return Promise.resolve(node || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let nodes = mockNodes;
        if (where.workspaceId) {
          nodes = nodes.filter((n) => n.workspaceId === where.workspaceId);
        }
        if (where.id && where.id.in) {
          nodes = nodes.filter((n) => where.id.in.includes(n.id));
        }
        return Promise.resolve(nodes);
      }),
    },
    memoryEdge: {
      create: jest.fn().mockImplementation(({ data }) => {
        const edge = {
          id: `edge-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: data.workspaceId,
          sourceNodeId: data.sourceNodeId,
          targetNodeId: data.targetNodeId,
          relationshipType: data.relationshipType,
          properties: data.properties || {},
          createdAt: new Date(),
        };
        mockEdges.push(edge);
        return Promise.resolve(edge);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let edges = mockEdges.filter(
          (e) => e.workspaceId === where.workspaceId,
        );
        if (where.OR) {
          edges = edges.filter((e) =>
            where.OR.some(
              (o: any) =>
                (o.sourceNodeId && e.sourceNodeId === o.sourceNodeId) ||
                (o.targetNodeId && e.targetNodeId === o.targetNodeId),
            ),
          );
        }
        return Promise.resolve(edges);
      }),
    },
  };

  const mockTenant = {};
  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => defaultVal),
  };

  beforeEach(async () => {
    mockDocuments = [];
    mockNodes = [];
    mockEdges = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationalMemoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantService, useValue: mockTenant },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<OrganizationalMemoryService>(
      OrganizationalMemoryService,
    );
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
    const search = await service.searchMemories(
      'ws-mem-test',
      'Kafka telemetry',
    );
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
