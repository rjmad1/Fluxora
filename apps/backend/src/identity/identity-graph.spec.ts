import { Test, TestingModule } from '@nestjs/testing';
import { IdentityGraphService } from './identity-graph.service';
import { PrismaService } from '../tenant/prisma.service';

describe('IdentityGraphService', () => {
  let service: IdentityGraphService;

  let mockProfiles: any[] = [];
  let mockNodes: any[] = [];
  let mockEdges: any[] = [];

  const mockPrismaService = {
    resolvedProfile: {
      create: jest.fn().mockImplementation(({ data }) => {
        const profile = {
          id: data.id || `prof-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: data.workspaceId,
          traits: data.traits || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockProfiles.push(profile);
        return Promise.resolve(profile);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockProfiles.find((p) => p.id === where.id) || null,
        );
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let results = mockProfiles;
        if (where && where.id && where.id.in) {
          results = results.filter((p) => where.id.in.includes(p.id));
        }
        if (where && where.workspaceId) {
          results = results.filter((p) => p.workspaceId === where.workspaceId);
        }
        return Promise.resolve(results);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const p = mockProfiles.find((x) => x.id === where.id);
        if (p) {
          Object.assign(p, data);
          return Promise.resolve(p);
        }
        return Promise.resolve(null);
      }),
      deleteMany: jest.fn().mockImplementation(({ where }) => {
        if (where && where.id && where.id.in) {
          mockProfiles = mockProfiles.filter(
            (p) => !where.id.in.includes(p.id),
          );
        }
        return Promise.resolve({ count: 1 });
      }),
    },
    identityNode: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const n = mockNodes.find(
          (x) =>
            x.workspaceId === where.workspaceId &&
            x.identifierType === where.identifierType &&
            x.identifierValue === where.identifierValue,
        );
        if (!n) return Promise.resolve(null);
        const resolvedProfile =
          mockProfiles.find((p) => p.id === n.resolvedProfileId) || null;
        return Promise.resolve({ ...n, resolvedProfile });
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let results = mockNodes.filter(
          (x) => x.workspaceId === where.workspaceId,
        );
        if (where.OR) {
          results = results.filter((x) =>
            where.OR.some(
              (o: any) =>
                x.identifierType === o.identifierType &&
                x.identifierValue === o.identifierValue,
            ),
          );
        }
        return Promise.resolve(results);
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        const match = where.workspaceId_identifierType_identifierValue;
        let node = mockNodes.find(
          (x) =>
            x.workspaceId === match.workspaceId &&
            x.identifierType === match.identifierType &&
            x.identifierValue === match.identifierValue,
        );
        if (!node) {
          node = {
            id: `node-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: create.workspaceId,
            identifierType: create.identifierType,
            identifierValue: create.identifierValue,
            resolvedProfileId: create.resolvedProfileId,
            createdAt: new Date(),
          };
          mockNodes.push(node);
        } else {
          node.resolvedProfileId = update.resolvedProfileId;
        }
        return Promise.resolve(node);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        const ids = where.resolvedProfileId.in;
        mockNodes.forEach((n) => {
          if (ids.includes(n.resolvedProfileId)) {
            n.resolvedProfileId = data.resolvedProfileId;
          }
        });
        return Promise.resolve({ count: 1 });
      }),
    },
    identityEdge: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const match = mockEdges.find((e) => {
          const check1 =
            e.workspaceId === where.workspaceId &&
            where.OR.some(
              (o: any) =>
                o.sourceNodeId === e.sourceNodeId &&
                o.targetNodeId === e.targetNodeId,
            );
          const check2 =
            e.workspaceId === where.workspaceId &&
            where.OR.some(
              (o: any) =>
                o.sourceNodeId === e.targetNodeId &&
                o.targetNodeId === e.sourceNodeId,
            );
          return check1 || check2;
        });
        return Promise.resolve(match || null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const edge = {
          id: `edge-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: data.workspaceId,
          sourceNodeId: data.sourceNodeId,
          targetNodeId: data.targetNodeId,
          linkType: data.linkType,
          confidenceScore: data.confidenceScore,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockEdges.push(edge);
        return Promise.resolve(edge);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockEdges.filter((e) => e.workspaceId === where.workspaceId),
        );
      }),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return await callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    mockProfiles = [];
    mockNodes = [];
    mockEdges = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityGraphService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<IdentityGraphService>(IdentityGraphService);
  });

  it('should create a new profile if no identifiers match', async () => {
    const profile = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'user1@example.com' },
    ]);

    expect(profile).toBeDefined();
    expect(profile.id).toBeDefined();
    expect(profile.workspaceId).toBe('ws-test');

    const graph = await service.getIdentityGraph('ws-test');
    expect(graph.profiles).toHaveLength(1);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].identifierValue).toBe('user1@example.com');
  });

  it('should resolve to the same profile if deterministic identifiers match', async () => {
    const profile1 = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'user2@example.com' },
    ]);

    const profile2 = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'user2@example.com' },
      { type: 'COOKIE', value: 'cookie-abc' },
    ]);

    expect(profile1.id).toBe(profile2.id);

    const graph = await service.getIdentityGraph('ws-test');
    expect(graph.profiles).toHaveLength(1);
    expect(graph.nodes).toHaveLength(2); // email node and cookie node
    expect(graph.edges).toHaveLength(1); // link between email and cookie
  });

  it('should merge profiles when a common identifier stitches them', async () => {
    // 1. Create Profile A with Cookie X
    const profileA = await service.resolveProfile('ws-test', [
      { type: 'COOKIE', value: 'cookie-x' },
    ]);

    // 2. Create Profile B with Email Y
    const profileB = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'email-y@test.com' },
    ]);

    expect(profileA.id).not.toBe(profileB.id);

    // 3. User logs in, linking Cookie X and Email Y
    const resolvedProfile = await service.resolveProfile('ws-test', [
      { type: 'COOKIE', value: 'cookie-x' },
      { type: 'EMAIL', value: 'email-y@test.com' },
    ]);

    // Should merge them, resolving to the oldest profile ID
    const oldestId = [profileA, profileB].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0].id;

    expect(resolvedProfile.id).toBe(oldestId);

    const graph = await service.getIdentityGraph('ws-test');
    expect(graph.profiles).toHaveLength(1);
  });

  it('should stitch probabilistically when confidence is above threshold', async () => {
    const profileA = await service.resolveProfile('ws-test', [
      { type: 'COOKIE', value: 'cookie-z' },
    ]);

    // Match probabilistically with high confidence (e.g. 0.8)
    const profileB = await service.resolveProfile(
      'ws-test',
      [],
      [{ type: 'COOKIE', value: 'cookie-z', confidence: 0.8 }],
    );

    expect(profileA.id).toBe(profileB.id);

    // Should NOT stitch if confidence is below threshold (e.g. 0.5)
    const profileC = await service.resolveProfile(
      'ws-test',
      [],
      [{ type: 'COOKIE', value: 'cookie-z', confidence: 0.5 }],
    );

    expect(profileC.id).not.toBe(profileA.id);
  });
});
