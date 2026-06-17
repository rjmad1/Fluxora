import { Test, TestingModule } from '@nestjs/testing';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';
import { ExtendedFeaturesRepository } from '../../extended-features/extended-features.repository';
import { TenantService } from '../../tenant/tenant.service';
import { PrismaService } from '../../tenant/prisma.service';

describe('ListeningModule (Decoupled Feature)', () => {
  let controller: ListeningController;
  let service: ListeningService;

  const mockTenantService = {
    getWorkspaceId: jest.fn().mockReturnValue('ws-1'),
  };

  // Mock Database In-Memory Arrays
  let mockMentions: any[] = [];
  let mockCompetitors: any[] = [];
  let mockCompetitorPosts: any[] = [];
  let mockCompetitorMixes: any[] = [];
  let mockCompetitorFrequencies: any[] = [];
  let mockTrends: any[] = [];
  let mockSettings: any[] = [];
  let mockAuditLogs: any[] = [];

  beforeEach(async () => {
    mockMentions = [
      {
        id: 'men-1',
        workspaceId: 'ws-1',
        content:
          'Fluxora platform is incredibly fast! Migrated our telemetry and saw analytics load in <500ms.',
        platform: 'twitter',
        sentiment: 'positive',
        source: '@dev_ops_jane',
        timestamp: new Date(),
        ticketCreated: false,
        ticketId: undefined,
      },
    ];

    mockCompetitors = [];
    mockCompetitorPosts = [];
    mockCompetitorMixes = [];
    mockCompetitorFrequencies = [];
    mockAuditLogs = [];

    mockTrends = [
      {
        id: 'trend-1',
        workspaceId: 'ws-1',
        niche: 'Technology',
        topic: 'ClickHouse Query Optimizations',
        volume: 45200,
        trendRate: 24,
        historicalEngagement: 4.2,
      },
    ];

    mockSettings = [
      {
        workspaceId: 'ws-1',
        twoFactorEnabled: false,
        retentionDays: 90,
        trackedKeywords: [],
        emailDigest: {
          enabled: false,
          frequency: 'weekly',
          day: 'Friday',
          time: '09:00',
        },
      },
    ];

    const mockPrismaService = {
      brandMention: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockMentions.filter((m) => m.workspaceId === where.workspaceId),
            ),
          ),
        findFirst: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockMentions.find(
                (m) => m.id === where.id && m.workspaceId === where.workspaceId,
              ) || null,
            ),
          ),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const m = mockMentions.find((x) => x.id === where.id);
          if (m) {
            Object.assign(m, data);
            return Promise.resolve(m);
          }
          return Promise.resolve(null);
        }),
      },
      competitor: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockCompetitors.filter(
                (c) => c.workspaceId === where.workspaceId,
              ),
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          const id = data.id || `comp-${Date.now()}`;
          const newComp = {
            id,
            workspaceId: data.workspaceId,
            name: data.name,
            handle: data.handle,
            followers: data.followers,
            engagementRate: data.engagementRate,
            shareOfVoice: data.shareOfVoice,
          };
          mockCompetitors.push(newComp);

          // Simulate Prisma nested creates
          if (data.posts && data.posts.create) {
            mockCompetitorPosts.push({
              id: `cp-${Date.now()}`,
              competitorId: id,
              content: data.posts.create.content || 'Mock content',
              engagementType: data.posts.create.engagementType || 'likes',
              engagementCount: data.posts.create.engagementCount || 100,
              timestamp: new Date(),
            });
          }
          if (data.mixes && data.mixes.create) {
            mockCompetitorMixes.push({
              competitorId: id,
              ...data.mixes.create,
            });
          }
          if (data.frequencies && data.frequencies.create) {
            mockCompetitorFrequencies.push({
              competitorId: id,
              ...data.frequencies.create,
            });
          }

          return Promise.resolve(newComp);
        }),
      },
      competitorPost: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockCompetitorPosts.filter((p) =>
                where.competitorId.in.includes(p.competitorId),
              ),
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          mockCompetitorPosts.push(data);
          return Promise.resolve(data);
        }),
      },
      competitorMix: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockCompetitorMixes.filter((m) =>
                where.competitorId.in.includes(m.competitorId),
              ),
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          mockCompetitorMixes.push(data);
          return Promise.resolve(data);
        }),
      },
      competitorFrequency: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockCompetitorFrequencies.filter((f) =>
                where.competitorId.in.includes(f.competitorId),
              ),
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          mockCompetitorFrequencies.push(data);
          return Promise.resolve(data);
        }),
      },
      trendingTopic: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockTrends.filter((t) => t.workspaceId === where.workspaceId),
            ),
          ),
      },
      workspaceSettings: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockSettings.find((s) => s.workspaceId === where.workspaceId) ||
                null,
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          mockSettings.push(data);
          return Promise.resolve(data);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const s = mockSettings.find(
            (x) => x.workspaceId === where.workspaceId,
          );
          if (s) {
            Object.assign(s, data);
            return Promise.resolve(s);
          }
          return Promise.resolve(null);
        }),
      },
      auditLog: {
        create: jest.fn().mockImplementation(({ data }) => {
          const log = {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            ...data,
          };
          mockAuditLogs.push(log);
          return Promise.resolve(log);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListeningController],
      providers: [
        ListeningService,
        ExtendedFeaturesRepository,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ListeningController>(ListeningController);
    service = module.get<ListeningService>(ListeningService);
  });

  it('should be defined and initialize correctly', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('Brand Mentions', () => {
    it('should query mentions matching tenant workspace context', async () => {
      const mentions = await controller.getMentions();
      expect(mentions).toBeInstanceOf(Array);
      expect(mentions.length).toBeGreaterThan(0);
      expect(mentions[0].workspaceId).toBe('ws-1');
    });

    it('should convert mention to a ticket in sandbox', async () => {
      const mentions = await service.getMentions('ws-1');
      const target = mentions.find((m) => !m.ticketCreated);

      if (target) {
        const ticket = await controller.convertToTicket({
          mentionId: target.id,
        });
        expect(ticket.ticketId).toBeDefined();
        expect(ticket.ticketId).toMatch(/^TKT-\d{5}$/);

        const allMentions = await service.getMentions('ws-1');
        const updated = allMentions.find((m) => m.id === target.id);
        expect(updated?.ticketCreated).toBe(true);
      }
    });
  });

  describe('Competitor setups', () => {
    it('should configure and register new competitor handles', async () => {
      const comp = await controller.setupCompetitor({
        name: 'Hootsync Plus',
        handle: '@hootsync_plus',
      });

      expect(comp.name).toBe('Hootsync Plus');
      expect(comp.handle).toBe('@hootsync_plus');

      const details = await controller.getCompetitorDetails();
      expect(details.posts.length).toBeGreaterThan(0);
    });
  });

  describe('Keyword filtering', () => {
    it('should add new tracking keywords to workspace settings', async () => {
      const keywords = await controller.addKeyword({ keyword: 'AI-scaling' });
      expect(keywords).toContain('AI-scaling');

      const final = await controller.removeKeyword('AI-scaling');
      expect(final).not.toContain('AI-scaling');
    });
  });

  describe('Trends and Virality', () => {
    it('should forecast trends and predict virality', async () => {
      const trends = await controller.getTrendingTopics();
      expect(trends).toBeInstanceOf(Array);

      const prediction = await controller.predictVirality({
        content: 'Short post! 🚀',
      });
      expect(prediction.score).toBeGreaterThanOrEqual(10);
      expect(prediction.shifts.length).toBeGreaterThan(0);
    });
  });
});
