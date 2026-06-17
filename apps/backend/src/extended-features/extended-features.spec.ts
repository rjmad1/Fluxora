import { Test, TestingModule } from '@nestjs/testing';
import { ExtendedFeaturesController } from './extended-features.controller';
import { ExtendedFeaturesService } from './extended-features.service';
import { ExtendedFeaturesRepository } from './extended-features.repository';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from '../tenant/prisma.service';

describe('ExtendedFeatures', () => {
  let controller: ExtendedFeaturesController;
  let service: ExtendedFeaturesService;

  const mockTenantService = {
    getWorkspaceId: jest.fn().mockReturnValue('ws-1'),
  };

  // Mock Database In-Memory Arrays
  let mockSettings: any[] = [];
  let mockMessages: any[] = [];
  let mockTags: any[] = [];
  let mockCollections: any[] = [];
  let mockWeights: any[] = [];
  let mockMediaItems: any[] = [];
  let mockAuditLogs: any[] = [];
  let mockShortenedLinks: any[] = [];

  beforeEach(async () => {
    // Reset DB mocks
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

    mockMessages = [
      {
        id: 'msg-1',
        workspaceId: 'ws-1',
        platform: 'linkedin',
        type: 'comment',
        sender: 'David Chen',
        body: 'Question?',
        sentiment: 'neutral',
        assignedTo: undefined,
        replies: [],
      },
    ];

    mockTags = [
      {
        id: 'tag-1',
        workspaceId: 'ws-1',
        name: 'clickhouse',
        color: '#8B5CF6',
        description: 'tag',
      },
    ];

    mockCollections = [
      {
        id: 'col-1',
        workspaceId: 'ws-1',
        name: 'Analytical Databases',
        rules: ['tag:clickhouse'],
        matchCount: 1,
      },
    ];

    mockWeights = [];
    mockMediaItems = [];
    mockAuditLogs = [];
    mockShortenedLinks = [
      {
        id: 'link-1',
        workspaceId: 'ws-1',
        originalUrl: 'https://google.com',
        shortenedUrl: 'flux.ora/abc123',
        customDomain: 'flux.ora',
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'launch',
        clicks: 0,
        geoClicks: { US: 0 },
      },
    ];

    const mockPrismaService = {
      brandMention: { count: jest.fn().mockResolvedValue(1) },
      tenant: { findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
      workspace: { findUnique: jest.fn().mockResolvedValue({ id: 'ws-1' }) },
      workspaceSettings: {
        count: jest.fn().mockResolvedValue(1),
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
      inboxMessage: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockMessages.filter((m) => m.workspaceId === where.workspaceId),
            ),
          ),
        findFirst: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockMessages.find(
                (m) => m.id === where.id && m.workspaceId === where.workspaceId,
              ) || null,
            ),
          ),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const m = mockMessages.find((x) => x.id === where.id);
          if (m) {
            Object.assign(m, data);
            return Promise.resolve(m);
          }
          return Promise.resolve(null);
        }),
      },
      taxonomyTag: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockTags.filter((t) => t.workspaceId === where.workspaceId),
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          const newTag = { id: `tag-${Date.now()}`, ...data };
          mockTags.push(newTag);
          return Promise.resolve(newTag);
        }),
      },
      autoCollection: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockCollections.filter(
                (c) => c.workspaceId === where.workspaceId,
              ),
            ),
          ),
      },
      shortenedLink: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where && where.customDomain) {
            return Promise.resolve(
              mockShortenedLinks.filter(
                (l) => l.customDomain === where.customDomain,
              ),
            );
          }
          if (where && where.workspaceId) {
            return Promise.resolve(
              mockShortenedLinks.filter(
                (l) => l.workspaceId === where.workspaceId,
              ),
            );
          }
          return Promise.resolve(mockShortenedLinks);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const newLink = {
            id: `link-${Date.now()}`,
            clicks: 0,
            geoClicks: { US: 0 },
            ...data,
          };
          mockShortenedLinks.push(newLink);
          return Promise.resolve(newLink);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const link = mockShortenedLinks.find((l) => l.id === where.id);
          if (link) {
            if (data.clicks && data.clicks.increment) {
              link.clicks = (link.clicks || 0) + data.clicks.increment;
            } else if (typeof data.clicks === 'number') {
              link.clicks = data.clicks;
            }
            if (data.geoClicks) {
              link.geoClicks = data.geoClicks;
            }
            return Promise.resolve(link);
          }
          return Promise.resolve(null);
        }),
      },
      topicWeight: {
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockWeights.filter((w) => w.workspaceId === where.workspaceId),
            ),
          ),
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          mockWeights = mockWeights.filter(
            (w) => w.workspaceId !== where.workspaceId,
          );
          return Promise.resolve({ count: 1 });
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          mockWeights.push(data);
          return Promise.resolve(data);
        }),
      },
      mediaStudioItem: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockMediaItems.find((i) => i.id === where.id) || null,
            ),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          mockMediaItems.push(data);
          return Promise.resolve(data);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const item = mockMediaItems.find((i) => i.id === where.id);
          if (item) {
            Object.assign(item, data);
            return Promise.resolve(item);
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
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              mockAuditLogs.filter((l) => l.workspaceId === where.workspaceId),
            ),
          ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtendedFeaturesController],
      providers: [
        ExtendedFeaturesService,
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

    controller = module.get<ExtendedFeaturesController>(
      ExtendedFeaturesController,
    );
    service = module.get<ExtendedFeaturesService>(ExtendedFeaturesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('Compliance Keyword Flagging', () => {
    it('should pass compliance on safe text', () => {
      const result = service.checkComplianceContent(
        'Building a telemetry stream using Kafka and ClickHouse for our social dashboards.',
      );
      expect(result.compliant).toBe(true);
      expect(result.flaggedKeywords).toHaveLength(0);
    });

    it('should flag prohibited phrases', () => {
      const result = service.checkComplianceContent(
        'Try this risk-free investment for guaranteed returns!',
      );
      expect(result.compliant).toBe(false);
      expect(result.flaggedKeywords).toContain('guaranteed returns');
    });
  });

  describe('Security Configuration', () => {
    it('should toggle 2FA settings', async () => {
      const settings = await controller.saveSecurity({
        twoFactorEnabled: true,
        retentionDays: 180,
      });

      expect(settings.twoFactorEnabled).toBe(true);
      expect(settings.retentionDays).toBe(180);

      const activeSettings = await service.getOrCreateSettings('ws-1');
      expect(activeSettings.twoFactorEnabled).toBe(true);
    });
  });

  describe('New Advanced Social Features', () => {
    it('should manage community CRM replies & assignment', async () => {
      const inbox = await controller.getInboxMessages();
      expect(inbox).toBeInstanceOf(Array);
      expect(inbox.length).toBeGreaterThan(0);

      const firstMessage = inbox[0];
      const initialRepliesCount = firstMessage.replies.length;

      const updatedReply = await controller.replyToInboxMessage({
        messageId: firstMessage.id,
        replyText: 'Thanks for reaching out!',
      });
      expect(updatedReply.replies.length).toBe(initialRepliesCount + 1);
      expect(updatedReply.replies[initialRepliesCount].body).toBe(
        'Thanks for reaching out!',
      );

      const updatedAssign = await controller.assignInboxMessage({
        messageId: firstMessage.id,
        assignedTo: 'Dave K.',
      });
      expect(updatedAssign.assignedTo).toBe('Dave K.');
    });

    it('should register custom taxonomy and save target dials', async () => {
      const initTaxonomy = await controller.getTaxonomyTags();
      const initialTagsCount = initTaxonomy.tags.length;

      const newTag = await controller.createTaxonomyTag({
        name: 'kubernetes',
        color: '#326CE5',
        description: 'Cluster setups',
      });
      expect(newTag.name).toBe('kubernetes');

      const finalTaxonomy = await controller.getTaxonomyTags();
      expect(finalTaxonomy.tags.length).toBe(initialTagsCount + 1);

      const weights = await controller.saveTopicWeights({
        weights: [
          { category: 'Technical Architectures', weight: 50 },
          { category: 'Product Releases', weight: 50 },
        ],
      });
      expect(
        weights.find((w) => w.category === 'Technical Architectures')?.weight,
      ).toBe(50);
    });

    it('should configure media transformations', async () => {
      const transformed = await controller.transformMediaItem({
        assetId: 'm-1',
        focalPoint: { x: 30, y: 70 },
        textOverlay: 'Latency: <500ms',
        watermarkPreset: 'white-bottom-right-60%',
      });

      expect(transformed.focalPoint).toEqual({ x: 30, y: 70 });
      expect(transformed.textOverlay).toBe('Latency: <500ms');
      expect(transformed.watermarkPreset).toBe('white-bottom-right-60%');
    });

    it('should shorten a link and track/trace redirects with UTM parameters', async () => {
      const shortened = await controller.shortenLink({
        originalUrl: 'https://fluxora.io/blog/scaling',
        customDomain: 'scale.fluxora.io',
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'scaling-launch',
      });
      expect(shortened.shortenedUrl).toContain('scale.fluxora.io/');

      const code = shortened.shortenedUrl.split('/').pop();

      const mockReq = {
        headers: { host: 'scale.fluxora.io' },
      } as any;

      const mockRes = {
        redirect: jest.fn(),
      } as any;

      await controller.redirectLink(code, mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        302,
        'https://fluxora.io/blog/scaling?utm_source=newsletter&utm_medium=email&utm_campaign=scaling-launch',
      );

      const links = await controller.getShortenedLinks();
      const updatedLink = links.find((l) => l.id === shortened.id);
      expect(updatedLink.clicks).toBe(1);
      expect(updatedLink.geoClicks.US).toBe(1);
    });
  });
});
