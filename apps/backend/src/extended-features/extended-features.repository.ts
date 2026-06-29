import { Injectable, Logger } from '@nestjs/common';
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
export class ExtendedFeaturesRepository {
  private readonly logger = new Logger(ExtendedFeaturesRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.inboxMessage.create({
      data: {
        workspaceId,
        conversationId: msg.conversationId,
        platform: msg.platform,
        senderName: 'Command Center Admin',
        text: replyText,
        isOutbound: true,
      },
    });
  }

  async assignInboxMessage(
    workspaceId: string,
    messageId: string,
    assignedTo: string,
  ) {
    return this.prisma.inboxMessage.update({
      where: { id: messageId },
      data: { assignedTo } as any,
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
