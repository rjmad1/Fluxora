import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';

export type {
  PostTemplate,
  LeaderboardEntry,
  ABTest,
  ShortenedLink,
  AuditLog,
  WorkspaceSettings,
  InboxMessage,
  TaxonomyTag,
  AutoCollection,
  TopicWeight,
  MediaStudioItem,
} from '@prisma/client';

@Injectable()
export class ExtendedFeaturesRepository implements OnModuleInit {
  private readonly logger = new Logger(ExtendedFeaturesRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialMockData();
  }

  private async seedInitialMockData() {
    try {
      // 1. Check if we have seeded already
      const mentionCount = await this.prisma.brandMention.count();
      if (mentionCount > 0) {
        this.logger.log('Database already has seeded extended features data.');
        return;
      }

      this.logger.log(
        'Database extended features tables are empty. Seeding mock data...',
      );

      const ws1 = 'ws-1';
      const ws2 = 'ws-2';
      const tenantId = 'tenant-1';

      // 2. Ensure default tenant & workspaces exist in PostgreSQL database
      const tenantExists = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenantExists) {
        await this.prisma.tenant.create({
          data: {
            id: tenantId,
            name: 'Default Tenant',
          },
        });
      }

      for (const wsId of [ws1, ws2]) {
        const wsExists = await this.prisma.workspace.findUnique({
          where: { id: wsId },
        });
        if (!wsExists) {
          await this.prisma.workspace.create({
            data: {
              id: wsId,
              tenantId,
              name: wsId === ws1 ? 'Workspace One' : 'Workspace Two',
            },
          });
        }
      }

      // 3. Seed Workspace Settings
      await this.prisma.workspaceSettings.createMany({
        data: [
          {
            workspaceId: ws1,
            twoFactorEnabled: false,
            retentionDays: 90,
            trackedKeywords: [
              'Fluxora',
              'telemetry',
              'ClickHouse',
              'Postgres RLS',
            ],
            emailDigest: {
              enabled: true,
              frequency: 'weekly',
              day: 'Friday',
              time: '09:00',
            },
          },
          {
            workspaceId: ws2,
            twoFactorEnabled: true,
            retentionDays: 180,
            trackedKeywords: ['CompetitorA', 'GlobalBrand'],
            emailDigest: {
              enabled: false,
              frequency: 'monthly',
              day: 'Monday',
              time: '12:00',
            },
          },
        ],
      });

      // 4. Seed Brand Mentions
      await this.prisma.brandMention.createMany({
        data: [
          {
            id: 'men-1',
            workspaceId: ws1,
            content:
              'Fluxora platform is incredibly fast! Migrated our telemetry and saw analytics load in <500ms.',
            platform: 'twitter',
            sentiment: 'positive',
            source: '@dev_ops_jane',
            timestamp: new Date(Date.now() - 3600000 * 2),
            ticketCreated: false,
          },
          {
            id: 'men-2',
            workspaceId: ws1,
            content:
              'Trouble configuring the custom domain redirection for short links in workspace A. Keeps returning 404.',
            platform: 'linkedin',
            sentiment: 'negative',
            source: 'Marcus Vance, Enterprise VP',
            timestamp: new Date(Date.now() - 3600000 * 4),
            ticketCreated: true,
            ticketId: 'TKT-88902',
          },
          {
            id: 'men-3',
            workspaceId: ws1,
            content:
              'Fluxora social media blast is scheduled for next Tuesday. Let us see how click-through rates diverge.',
            platform: 'facebook',
            sentiment: 'neutral',
            source: 'Agency Ops Hub',
            timestamp: new Date(Date.now() - 3600000 * 8),
            ticketCreated: false,
          },
        ],
      });

      // 5. Seed Competitors
      const comps = [
        {
          id: 'comp-1',
          workspaceId: ws1,
          name: 'BufferStream Inc',
          handle: '@bufferstream',
          followers: 245000,
          engagementRate: 2.4,
          shareOfVoice: 35,
        },
        {
          id: 'comp-2',
          workspaceId: ws1,
          name: 'Hootsync',
          handle: '@hootsync',
          followers: 512000,
          engagementRate: 1.8,
          shareOfVoice: 42,
        },
        {
          id: 'comp-3',
          workspaceId: ws1,
          name: 'SproutVibe',
          handle: '@sproutvibe',
          followers: 98000,
          engagementRate: 4.1,
          shareOfVoice: 23,
        },
      ];

      for (const comp of comps) {
        await this.prisma.competitor.create({
          data: {
            ...comp,
            posts: {
              createMany: {
                data: [
                  {
                    content: 'PG benchmark highlights 10x gains!',
                    engagementType: 'likes',
                    engagementCount: 1420,
                  },
                ],
              },
            },
            mixes: {
              create: {
                video: 40,
                image: 45,
                text: 15,
              },
            },
            frequencies: {
              create: {
                frequency: '4 posts/day',
                pattern: '9AM, 1PM, 5PM EST',
              },
            },
          },
        });
      }

      // 6. Seed Templates
      await this.prisma.postTemplate.createMany({
        data: [
          {
            id: 'tpl-1',
            workspaceId: ws1,
            title: 'Enterprise Scalability Launch',
            content:
              'Thrilled to unveil our high-throughput telemetry stream powered by Kafka and ClickHouse! Real-time aggregates in under 500ms ⚡ #BigData #Scale',
            category: 'Product Launch',
            author: 'Admin Team',
            expiresAt: new Date(Date.now() + 86400000 * 30),
            sharedCount: 42,
          },
          {
            id: 'tpl-2',
            workspaceId: ws1,
            title: 'Hiring Notice: Senior SRE',
            content:
              'We are expanding! Looking for an expert in NestJS, Postgres RLS boundaries, and Temporal workflows. Apply today: {link} #Hiring #SRE #TechJobs',
            category: 'Recruiting',
            author: 'HR Dept',
            expiresAt: new Date(Date.now() + 86400000 * 15),
            sharedCount: 18,
          },
          {
            id: 'tpl-3',
            workspaceId: ws1,
            title: 'System Maintenance Alert',
            content:
              'Fluxora systems will undergo scheduled telemetry database replication audits on June 18th at 03:00 UTC. Fallback log servers are active.',
            category: 'Corporate Notice',
            author: 'Security Lead',
            expiresAt: new Date(Date.now() + 86400000 * 3),
            sharedCount: 5,
          },
        ],
      });

      // 7. Seed Leaderboard
      await this.prisma.leaderboardEntry.createMany({
        data: [
          {
            id: 'lead-1',
            workspaceId: ws1,
            employeeName: 'Sarah Jenkins',
            department: 'Sales & Growth',
            postsShared: 28,
            reach: 45000,
            points: 1420,
          },
          {
            id: 'lead-2',
            workspaceId: ws1,
            employeeName: 'Alex Mercer',
            department: 'Engineering',
            postsShared: 22,
            reach: 38200,
            points: 1150,
          },
          {
            id: 'lead-3',
            workspaceId: ws1,
            employeeName: 'Elena Rostova',
            department: 'Product Management',
            postsShared: 19,
            reach: 21000,
            points: 950,
          },
          {
            id: 'lead-4',
            workspaceId: ws1,
            employeeName: 'Dave K.',
            department: 'Marketing',
            postsShared: 14,
            reach: 18400,
            points: 720,
          },
        ],
      });

      // 8. Seed ABTests
      await this.prisma.aBTest.createMany({
        data: [
          {
            id: 'test-1',
            workspaceId: ws1,
            title: 'CTA Button Placement Experiment',
            variantA:
              'Check out our ClickHouse performance dashboard today! {link}',
            variantB:
              'Ready to scale telemetry? Try the new real-time performance dashboard! {link}',
            allocationA: 50,
            allocationB: 50,
            winnerCriteria: 'clicks',
            status: 'completed',
            winner: 'B',
            conversionA: 3.8,
            conversionB: 5.9,
            performanceA: [12, 24, 38, 48, 55, 68, 76, 82],
            performanceB: [15, 29, 45, 62, 79, 94, 112, 128],
            createdAt: new Date(Date.now() - 86400000 * 5),
          },
          {
            id: 'test-2',
            workspaceId: ws1,
            title: 'Emoji Engagement Analysis',
            variantA:
              'Introducing our advanced row level tenant security structure.',
            variantB:
              'Introducing our advanced row-level tenant security structure! 🛡️🔒 #security #saas',
            allocationA: 60,
            allocationB: 40,
            winnerCriteria: 'engagement',
            status: 'running',
            winner: 'none',
            conversionA: 1.2,
            conversionB: 2.8,
            performanceA: [5, 12, 19, 24],
            performanceB: [8, 22, 39, 58],
            createdAt: new Date(Date.now() - 3600000 * 6),
          },
        ],
      });

      // 9. Seed Shortened Links
      await this.prisma.shortenedLink.createMany({
        data: [
          {
            id: 'link-1',
            workspaceId: ws1,
            originalUrl: 'https://github.com/fluxora/telemetry/pull/1082',
            shortenedUrl: 'flux.ora/t-1082',
            customDomain: 'flux.ora',
            utmSource: 'newsletter',
            utmMedium: 'email',
            utmCampaign: 'scaling-launch',
            clicks: 842,
            retargetingPixels: {
              meta: 'px-meta-9092',
              google: 'aw-google-112',
            },
            geoClicks: { US: 450, GB: 120, DE: 82, CA: 64, IN: 126 },
            createdAt: new Date(Date.now() - 86400000 * 10),
          },
          {
            id: 'link-2',
            workspaceId: ws1,
            originalUrl: 'https://fluxora.com/jobs/senior-sre-telemetry',
            shortenedUrl: 'jobs.fluxora.com/sre-s',
            customDomain: 'jobs.fluxora.com',
            utmSource: 'linkedin',
            utmMedium: 'social',
            utmCampaign: 'sre-recruiting',
            clicks: 318,
            retargetingPixels: { linkedin: 'px-li-5541' },
            geoClicks: { US: 180, CA: 45, GB: 32, IN: 61 },
            createdAt: new Date(Date.now() - 86400000 * 4),
          },
        ],
      });

      // 10. Seed Audit Logs
      await this.prisma.auditLog.createMany({
        data: [
          {
            id: 'log-1',
            workspaceId: ws1,
            actor: 'superadmin@fluxora.com',
            action: '2fa.enforce_global',
            timestamp: new Date(Date.now() - 3600000 * 24),
            status: 'SUCCESS',
          },
          {
            id: 'log-2',
            workspaceId: ws1,
            actor: 'manager@fluxora.com',
            action: 'digest.configure_wizard',
            timestamp: new Date(Date.now() - 3600000 * 20),
            status: 'SUCCESS',
          },
        ],
      });

      // 11. Seed Trending Topics
      await this.prisma.trendingTopic.createMany({
        data: [
          {
            id: 'trend-1',
            workspaceId: ws1,
            niche: 'Technology',
            topic: 'ClickHouse Query Optimizations',
            volume: 45200,
            trendRate: 24,
            historicalEngagement: 4.2,
          },
          {
            id: 'trend-2',
            workspaceId: ws1,
            niche: 'Technology',
            topic: 'Kafka Real-time Streams',
            volume: 32800,
            trendRate: 18,
            historicalEngagement: 3.9,
          },
          {
            id: 'trend-5',
            workspaceId: ws2,
            niche: 'Global Business',
            topic: 'European Data Privacy Updates',
            volume: 22000,
            trendRate: 35,
            historicalEngagement: 3.2,
          },
        ],
      });

      // 12. Seed Inbox Messages
      await this.prisma.inboxMessage.createMany({
        data: [
          {
            id: 'msg-1',
            workspaceId: ws1,
            platform: 'linkedin',
            type: 'comment',
            sender: 'David Chen',
            body: 'How does the Kafka fallback behavior handle partitioned queue offline events?',
            sentiment: 'neutral',
            assignedTo: 'Elena Rostova',
            timestamp: new Date(Date.now() - 3600000 * 2),
            replies: [
              {
                id: 'r-1',
                sender: 'Elena Rostova',
                body: 'We spool event batches locally to JSON log buffers before retrying the ClickHouse ingest stream!',
                timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
              },
            ],
          },
          {
            id: 'msg-2',
            workspaceId: ws1,
            platform: 'twitter',
            type: 'dm',
            sender: '@tech_growth_hub',
            body: 'Just checked out the scaling simulator, absolutely incredible performance dashboards!',
            sentiment: 'positive',
            assignedTo: 'Sarah Jenkins',
            timestamp: new Date(Date.now() - 3600000 * 4),
            replies: [],
          },
        ],
      });

      // 13. Seed Taxonomy Tags & AutoCollections
      await this.prisma.taxonomyTag.createMany({
        data: [
          {
            id: 'tag-1',
            workspaceId: ws1,
            name: 'clickhouse',
            color: '#8B5CF6',
            description: 'Real-time telemetry and database analytics',
          },
          {
            id: 'tag-2',
            workspaceId: ws1,
            name: 'kafka',
            color: '#3B82F6',
            description: 'Event streaming and publish-subscribe pipelines',
          },
        ],
      });

      await this.prisma.autoCollection.createMany({
        data: [
          {
            id: 'col-1',
            workspaceId: ws1,
            name: 'Analytical Databases',
            rules: ['tag:clickhouse'],
            matchCount: 1,
          },
        ],
      });

      // 14. Seed Topic Weights
      await this.prisma.topicWeight.createMany({
        data: [
          { workspaceId: ws1, category: 'Technical Architectures', weight: 45 },
          { workspaceId: ws1, category: 'Product Releases', weight: 35 },
          { workspaceId: ws1, category: 'Hiring & Culture', weight: 20 },
        ],
      });

      // 15. Seed MediaStudioItems
      await this.prisma.mediaStudioItem.createMany({
        data: [
          {
            id: 'm-1',
            workspaceId: ws1,
            name: 'telemetry_ingestion_chart.png',
            aspectRatios: [
              {
                ratio: '1:1',
                width: 1080,
                height: 1080,
                url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
              },
            ],
            focalPoint: { x: 50, y: 50 },
            watermarkPreset: 'None',
            textOverlay: '',
            audioWaveform: false,
          },
        ],
      });

      this.logger.log('Mock database seeding completed successfully.');
    } catch (err) {
      this.logger.error(
        'Error seeding mock extended features data:',
        err.message,
      );
    }
  }

  // --- QUERY WRAPPERS ---

  async getMentions(workspaceId: string) {
    return this.prisma.brandMention.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createMention(workspaceId: string, data: any) {
    return this.prisma.brandMention.create({
      data: {
        workspaceId,
        ...data,
      },
    });
  }

  async getCompetitors(workspaceId: string) {
    return this.prisma.competitor.findMany({
      where: { workspaceId },
    });
  }

  async setupCompetitor(workspaceId: string, competitor: any) {
    return this.prisma.competitor.create({
      data: {
        workspaceId,
        name: competitor.name || 'Unknown Competitor',
        handle: competitor.handle || '@handle',
        followers:
          competitor.followers || Math.floor(10000 + Math.random() * 500000),
        engagementRate:
          competitor.engagementRate ||
          parseFloat((1 + Math.random() * 5).toFixed(1)),
        shareOfVoice:
          competitor.shareOfVoice || Math.floor(5 + Math.random() * 25),
        posts: {
          create: {
            content: `Check out our new tool launch at ${competitor.handle || '@handle'}! Feedback appreciated.`,
            engagementType: 'likes',
            engagementCount: Math.floor(100 + Math.random() * 2000),
          },
        },
        mixes: {
          create: {
            video: 30,
            image: 50,
            text: 20,
          },
        },
        frequencies: {
          create: {
            frequency: '2 posts/day',
            pattern: 'Morning / Afternoon spikes',
          },
        },
      },
    });
  }

  async getCompetitorDetails(workspaceId: string) {
    const competitors = await this.getCompetitors(workspaceId);
    const competitorIds = competitors.map((c) => c.id);

    const posts = await this.prisma.competitorPost.findMany({
      where: { competitorId: { in: competitorIds } },
    });
    const mixes = await this.prisma.competitorMix.findMany({
      where: { competitorId: { in: competitorIds } },
    });
    const frequencies = await this.prisma.competitorFrequency.findMany({
      where: { competitorId: { in: competitorIds } },
    });

    return { posts, mixes, frequencies };
  }

  async getTemplates(workspaceId: string) {
    return this.prisma.postTemplate.findMany({
      where: {
        workspaceId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async createTemplate(workspaceId: string, data: any) {
    return this.prisma.postTemplate.create({
      data: {
        workspaceId,
        ...data,
      },
    });
  }

  async shareTemplate(workspaceId: string, templateId: string) {
    const template = await this.prisma.postTemplate.findFirst({
      where: { id: templateId, workspaceId },
    });
    if (!template) throw new Error('Template not found or has expired');

    return this.prisma.postTemplate.update({
      where: { id: templateId },
      data: { sharedCount: template.sharedCount + 1 },
    });
  }

  async getLeaderboard(workspaceId: string) {
    return this.prisma.leaderboardEntry.findMany({
      where: { workspaceId },
      orderBy: { points: 'desc' },
    });
  }

  async getSettings(workspaceId: string) {
    return this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });
  }

  async getOrCreateSettings(workspaceId: string) {
    let settings = await this.getSettings(workspaceId);
    if (!settings) {
      settings = await this.prisma.workspaceSettings.create({
        data: {
          workspaceId,
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
      });
    }
    return settings;
  }

  async updateSettings(workspaceId: string, data: any) {
    await this.getOrCreateSettings(workspaceId);
    return this.prisma.workspaceSettings.update({
      where: { workspaceId },
      data,
    });
  }

  async getABTests(workspaceId: string) {
    return this.prisma.aBTest.findMany({
      where: { workspaceId },
    });
  }

  async createABTest(workspaceId: string, test: any) {
    return this.prisma.aBTest.create({
      data: {
        workspaceId,
        title: test.title || 'Untitled Variant Test',
        variantA: test.variantA || '',
        variantB: test.variantB || '',
        allocationA: test.allocationA ?? 50,
        allocationB: test.allocationB ?? 50,
        winnerCriteria: test.winnerCriteria || 'clicks',
        status: 'running',
        conversionA: 0,
        conversionB: 0,
        performanceA: [0],
        performanceB: [0],
      },
    });
  }

  async getShortenedLinks(workspaceId: string) {
    return this.prisma.shortenedLink.findMany({
      where: { workspaceId },
    });
  }

  async shortenLink(workspaceId: string, link: any) {
    const code = Math.random().toString(36).substring(2, 8);
    const shortenedUrl = `${link.customDomain || 'flux.ora'}/${code}`;

    return this.prisma.shortenedLink.create({
      data: {
        workspaceId,
        originalUrl: link.originalUrl,
        shortenedUrl,
        customDomain: link.customDomain || 'flux.ora',
        utmSource: link.utmSource,
        utmMedium: link.utmMedium,
        utmCampaign: link.utmCampaign,
        clicks: 0,
        retargetingPixels: {},
        geoClicks: { US: 0 },
      },
    });
  }

  async resolveAndClickLink(host: string, code: string) {
    // 1. Try to match customDomain AND code suffix
    const links = await this.prisma.shortenedLink.findMany({
      where: { customDomain: host },
    });

    let link = links.find((l) => l.shortenedUrl.endsWith(`/${code}`));

    // 2. Fallback: match by code suffix across all shortened links
    if (!link) {
      const allLinks = await this.prisma.shortenedLink.findMany();
      link = allLinks.find((l) => l.shortenedUrl.endsWith(`/${code}`));
    }

    if (!link) return null;

    const currentGeo = (link.geoClicks as Record<string, number>) || {};
    const updatedGeo = {
      ...currentGeo,
      US: (currentGeo['US'] || 0) + 1,
    };

    return this.prisma.shortenedLink.update({
      where: { id: link.id },
      data: {
        clicks: { increment: 1 },
        geoClicks: updatedGeo,
      },
    });
  }

  async getAuditLogs(workspaceId: string) {
    return this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async logAction(
    workspaceId: string,
    actor: string,
    action: string,
    status: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        workspaceId,
        actor,
        action,
        status,
      },
    });
  }

  async getInboxMessages(workspaceId: string) {
    return this.prisma.inboxMessage.findMany({
      where: { workspaceId },
    });
  }

  async replyToInboxMessage(
    workspaceId: string,
    messageId: string,
    replyText: string,
  ) {
    const msg = await this.prisma.inboxMessage.findFirst({
      where: { id: messageId, workspaceId },
    });
    if (!msg) throw new Error('Message not found');

    const repliesArr = Array.isArray(msg.replies) ? (msg.replies as any[]) : [];
    const updatedReplies = [
      ...repliesArr,
      {
        id: `r-${Date.now()}`,
        sender: 'Command Center Admin',
        body: replyText,
        timestamp: new Date().toISOString(),
      },
    ];

    return this.prisma.inboxMessage.update({
      where: { id: messageId },
      data: { replies: updatedReplies },
    });
  }

  async assignInboxMessage(
    workspaceId: string,
    messageId: string,
    assignedTo: string,
  ) {
    return this.prisma.inboxMessage.update({
      where: { id: messageId },
      data: { assignedTo },
    });
  }

  async getTaxonomyTags(workspaceId: string) {
    const tags = await this.prisma.taxonomyTag.findMany({
      where: { workspaceId },
    });
    const collections = await this.prisma.autoCollection.findMany({
      where: { workspaceId },
    });
    const weights = await this.prisma.topicWeight.findMany({
      where: { workspaceId },
    });
    return { tags, collections, weights };
  }

  async createTaxonomyTag(workspaceId: string, tag: any) {
    return this.prisma.taxonomyTag.create({
      data: {
        workspaceId,
        name: tag.name || 'new-tag',
        color: tag.color || '#8B5CF6',
        description: tag.description || 'Custom tag',
      },
    });
  }

  async saveTopicWeights(workspaceId: string, weights: any[]) {
    // Delete existing topic weights for the workspace
    await this.prisma.topicWeight.deleteMany({
      where: { workspaceId },
    });

    for (const w of weights) {
      await this.prisma.topicWeight.create({
        data: {
          workspaceId,
          category: w.category,
          weight: Number(w.weight),
        },
      });
    }

    return this.prisma.topicWeight.findMany({
      where: { workspaceId },
    });
  }

  async transformMediaItem(workspaceId: string, body: any) {
    const assetId = body.assetId;
    let item = await this.prisma.mediaStudioItem.findUnique({
      where: { id: assetId },
    });

    if (!item) {
      item = await this.prisma.mediaStudioItem.create({
        data: {
          id: assetId,
          workspaceId,
          name: body.name || 'media_asset.png',
          aspectRatios: [
            {
              ratio: '1:1',
              width: 1080,
              height: 1080,
              url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
            },
          ],
        },
      });
    }

    const updateData: any = {};
    if (body.aspectRatios) updateData.aspectRatios = body.aspectRatios;
    if (body.focalPoint) updateData.focalPoint = body.focalPoint;
    if (body.watermarkPreset !== undefined)
      updateData.watermarkPreset = body.watermarkPreset;
    if (body.textOverlay !== undefined)
      updateData.textOverlay = body.textOverlay;
    if (body.audioWaveform !== undefined)
      updateData.audioWaveform = body.audioWaveform;

    return this.prisma.mediaStudioItem.update({
      where: { id: assetId },
      data: updateData,
    });
  }

  async getTrendingTopics(workspaceId: string) {
    return this.prisma.trendingTopic.findMany({
      where: { workspaceId },
    });
  }

  async convertMentionToTicket(workspaceId: string, mentionId: string) {
    const mention = await this.prisma.brandMention.findFirst({
      where: { id: mentionId, workspaceId },
    });
    if (!mention) throw new Error('Mention not found');

    const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    await this.prisma.brandMention.update({
      where: { id: mentionId },
      data: {
        ticketCreated: true,
        ticketId,
      },
    });

    return { ticketId };
  }
}
