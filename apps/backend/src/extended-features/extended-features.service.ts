import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ExtendedFeaturesRepository } from './extended-features.repository';

export interface BrandMention {
  id: string;
  workspaceId: string;
  content: string;
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  timestamp: string;
  ticketCreated: boolean;
  ticketId?: string;
}

export interface Competitor {
  id: string;
  workspaceId: string;
  name: string;
  handle: string;
  followers: number;
  engagementRate: number;
  shareOfVoice: number;
}

export interface PostTemplate {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  category: string;
  author: string;
  expiresAt: string;
  sharedCount: number;
}

export interface LeaderboardEntry {
  id: string;
  workspaceId: string;
  employeeName: string;
  department: string;
  postsShared: number;
  reach: number;
  points: number;
}

export interface ABTest {
  id: string;
  workspaceId: string;
  title: string;
  variantA: string;
  variantB: string;
  allocationA: number;
  allocationB: number;
  winnerCriteria: 'clicks' | 'engagement';
  status: 'running' | 'completed';
  winner?: 'A' | 'B' | 'none';
  conversionA: number;
  conversionB: number;
  performanceA: number[];
  performanceB: number[];
  createdAt: string;
}

export interface ShortenedLink {
  id: string;
  workspaceId: string;
  originalUrl: string;
  shortenedUrl: string;
  customDomain: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  clicks: number;
  retargetingPixels: {
    meta?: string;
    google?: string;
    linkedin?: string;
  };
  geoClicks: Record<string, number>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actor: string;
  action: string;
  timestamp: string;
  status: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  twoFactorEnabled: boolean;
  retentionDays: number;
  trackedKeywords: string[];
  emailDigest: {
    enabled: boolean;
    frequency: string;
    day: string;
    time: string;
  };
}

export interface TrendingTopic {
  id: string;
  workspaceId: string;
  niche: string;
  topic: string;
  volume: number;
  trendRate: number; // e.g. +24 or -5
  historicalEngagement: number; // e.g. 4.2%
}

export interface CompetitorPost {
  id: string;
  competitorId: string;
  content: string;
  engagementType: 'likes' | 'shares' | 'comments';
  engagementCount: number;
  timestamp: string;
}

export interface CompetitorMix {
  competitorId: string;
  video: number;
  image: number;
  text: number;
}

export interface CompetitorFrequency {
  competitorId: string;
  frequency: string;
  pattern: string;
}

export interface InboxMessage {
  id: string;
  workspaceId: string;
  platform: string;
  type: 'comment' | 'dm' | 'review';
  sender: string;
  body: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  assignedTo?: string;
  timestamp: string;
  replies: Array<{
    id: string;
    sender: string;
    body: string;
    timestamp: string;
  }>;
}

export interface TaxonomyTag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description: string;
}

export interface AutoCollection {
  id: string;
  workspaceId: string;
  name: string;
  rules: string[]; // e.g. ["tag:clickhouse"]
  matchCount: number;
}

export interface TopicWeight {
  workspaceId: string;
  category: string;
  weight: number;
}

export interface ViralityPrediction {
  score: number;
  shifts: string[];
  adjustments: string[];
}

export interface MediaStudioItem {
  id: string;
  workspaceId: string;
  name: string;
  aspectRatios: Array<{
    ratio: string;
    width: number;
    height: number;
    url: string;
  }>;
  focalPoint?: { x: number; y: number };
  watermarkPreset?: string;
  textOverlay?: string;
  audioWaveform?: boolean;
}

@Injectable()
export class ExtendedFeaturesService {
  private readonly logger = new Logger(ExtendedFeaturesService.name);

  constructor(private readonly repository: ExtendedFeaturesRepository) {}

  get data() {
    return this.repository.getData();
  }

  private saveData() {
    this.repository.saveData();
  }

  // --- EMPLOYEE ADVOCACY ---
  getTemplates(workspaceId: string): PostTemplate[] {
    // Filter expired templates
    return this.data.templates.filter(
      (t) =>
        t.workspaceId === workspaceId &&
        new Date(t.expiresAt).getTime() > Date.now(),
    );
  }

  shareTemplate(
    workspaceId: string,
    templateId: string,
  ): { success: boolean; sharedCount: number } {
    const template = this.data.templates.find(
      (t) => t.id === templateId && t.workspaceId === workspaceId,
    );
    if (!template) {
      throw new Error('Template not found or has expired');
    }

    template.sharedCount += 1;
    this.saveData();

    this.logAction(
      workspaceId,
      'employee@fluxora.com',
      `advocacy.share_template (Template ID: ${templateId})`,
      'SUCCESS',
    );

    return { success: true, sharedCount: template.sharedCount };
  }

  getLeaderboard(workspaceId: string): LeaderboardEntry[] {
    return this.data.leaderboard
      .filter((l) => l.workspaceId === workspaceId)
      .sort((a, b) => b.points - a.points);
  }

  saveEmailDigestConfig(
    workspaceId: string,
    config: WorkspaceSettings['emailDigest'],
  ): WorkspaceSettings {
    const settings = this.getOrCreateSettings(workspaceId);
    settings.emailDigest = config;
    this.saveData();

    this.logAction(
      workspaceId,
      'manager@fluxora.com',
      `advocacy.configure_digest (Frequency: ${config.frequency}, Day: ${config.day})`,
      'SUCCESS',
    );

    return settings;
  }

  // --- A/B TESTING ---
  getABTests(workspaceId: string): ABTest[] {
    return this.data.abTests.filter((t) => t.workspaceId === workspaceId);
  }

  createABTest(workspaceId: string, test: Partial<ABTest>): ABTest {
    const newTest: ABTest = {
      id: `test-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
    };

    this.data.abTests.push(newTest);
    this.saveData();

    this.logAction(
      workspaceId,
      'marketer@fluxora.com',
      `ab_test.create (Title: "${newTest.title}", Allocation: ${newTest.allocationA}/${newTest.allocationB})`,
      'SUCCESS',
    );

    return newTest;
  }

  // --- LINK SHORTENING ---
  getShortenedLinks(workspaceId: string): ShortenedLink[] {
    return this.data.shortenedLinks.filter(
      (l) => l.workspaceId === workspaceId,
    );
  }

  shortenLink(
    workspaceId: string,
    link: {
      originalUrl: string;
      customDomain: string;
      utmSource: string;
      utmMedium: string;
      utmCampaign: string;
    },
  ): ShortenedLink {
    const code = crypto.randomBytes(3).toString('hex');
    const shortenedUrl = `${link.customDomain || 'flux.ora'}/${code}`;

    const newLink: ShortenedLink = {
      id: `link-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
    };

    this.data.shortenedLinks.push(newLink);
    this.saveData();

    this.logAction(
      workspaceId,
      'marketer@fluxora.com',
      `link.shorten (Original: "${link.originalUrl}", Shortened: "${shortenedUrl}")`,
      'SUCCESS',
    );

    return newLink;
  }

  // --- COMPLIANCE & AUDIT ---
  getAuditLogs(workspaceId: string): AuditLog[] {
    return this.data.auditLogs
      .filter((l) => l.workspaceId === workspaceId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  checkComplianceContent(content: string): {
    compliant: boolean;
    flaggedKeywords: string[];
  } {
    // Legal Compliance keywords (prohibited words in social media communications/financial claims)
    const prohibited = [
      'guaranteed returns',
      'risk-free investment',
      'insider trading',
      'buy now double',
      '100% win rate',
      'no-fail profit',
      'manipulate price',
      'ponzi scheme',
      'tax evasion',
    ];

    const flagged = prohibited.filter((word) =>
      content.toLowerCase().includes(word.toLowerCase()),
    );

    return {
      compliant: flagged.length === 0,
      flaggedKeywords: flagged,
    };
  }

  saveSecurityConfig(
    workspaceId: string,
    twoFactorEnabled: boolean,
    retentionDays: number,
  ): WorkspaceSettings {
    const settings = this.getOrCreateSettings(workspaceId);
    settings.twoFactorEnabled = twoFactorEnabled;
    settings.retentionDays = retentionDays;
    this.saveData();

    this.logAction(
      workspaceId,
      'superadmin@fluxora.com',
      `security.configure (2FA Enforce: ${twoFactorEnabled}, Retention: ${retentionDays} days)`,
      'SUCCESS',
    );

    return settings;
  }

  // --- LOG ACTIONS ---
  logAction(
    workspaceId: string,
    actor: string,
    action: string,
    status: string,
  ): AuditLog {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      workspaceId,
      actor,
      action,
      timestamp: new Date().toISOString(),
      status,
    };
    this.data.auditLogs.unshift(log);
    this.saveData();
    return log;
  }

  // --- SETTINGS HELPER ---
  getOrCreateSettings(workspaceId: string): WorkspaceSettings {
    if (!this.data.settings[workspaceId]) {
      this.data.settings[workspaceId] = {
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
      };
      this.saveData();
    }
    return this.data.settings[workspaceId];
  }

  // --- COMMUNITY CRM ---
  getInboxMessages(workspaceId: string): InboxMessage[] {
    return this.data.inboxMessages.filter((m) => m.workspaceId === workspaceId);
  }

  replyToInboxMessage(
    workspaceId: string,
    messageId: string,
    replyText: string,
  ): InboxMessage {
    const message = this.data.inboxMessages.find(
      (m) => m.id === messageId && m.workspaceId === workspaceId,
    );
    if (!message) {
      throw new Error('Message not found');
    }

    const newReply = {
      id: `r-${Date.now()}`,
      sender: 'Command Center Admin',
      body: replyText,
      timestamp: new Date().toISOString(),
    };

    message.replies.push(newReply);
    this.saveData();

    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `inbox.reply (Message ID: ${messageId})`,
      'SUCCESS',
    );

    return message;
  }

  assignInboxMessage(
    workspaceId: string,
    messageId: string,
    teamMember: string,
  ): InboxMessage {
    const message = this.data.inboxMessages.find(
      (m) => m.id === messageId && m.workspaceId === workspaceId,
    );
    if (!message) {
      throw new Error('Message not found');
    }

    message.assignedTo = teamMember;
    this.saveData();

    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `inbox.assign (Message ID: ${messageId}, AssignedTo: ${teamMember})`,
      'SUCCESS',
    );

    return message;
  }

  // --- TAXONOMY & TAGGING ---
  getTaxonomyTags(workspaceId: string): {
    tags: TaxonomyTag[];
    collections: AutoCollection[];
    weights: TopicWeight[];
  } {
    // Guarantee basic entries if empty
    const wsTags = this.data.taxonomyTags.filter(
      (t) => t.workspaceId === workspaceId,
    );
    const wsCols = this.data.autoCollections.filter(
      (c) => c.workspaceId === workspaceId,
    );
    const wsWeights = this.data.topicWeights.filter(
      (w) => w.workspaceId === workspaceId,
    );

    return {
      tags: wsTags,
      collections: wsCols,
      weights: wsWeights,
    };
  }

  createTaxonomyTag(
    workspaceId: string,
    tag: Partial<TaxonomyTag>,
  ): TaxonomyTag {
    const newTag: TaxonomyTag = {
      id: `tag-${Date.now()}`,
      workspaceId,
      name: tag.name || 'new-tag',
      color: tag.color || '#8B5CF6',
      description: tag.description || 'Custom tag',
    };

    this.data.taxonomyTags.push(newTag);
    this.saveData();

    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `taxonomy.create_tag (Tag: "${newTag.name}")`,
      'SUCCESS',
    );

    return newTag;
  }

  saveTopicWeights(
    workspaceId: string,
    weights: Array<{ category: string; weight: number }>,
  ): TopicWeight[] {
    // Overwrite existing weights for workspaceId
    this.data.topicWeights = this.data.topicWeights.filter(
      (w) => w.workspaceId !== workspaceId,
    );
    weights.forEach((w) => {
      this.data.topicWeights.push({
        workspaceId,
        category: w.category,
        weight: w.weight,
      });
    });

    this.saveData();
    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `taxonomy.save_weights`,
      'SUCCESS',
    );

    return this.data.topicWeights.filter((w) => w.workspaceId === workspaceId);
  }

  bulkUpdateMetadata(
    workspaceId: string,
    assetIds: string[],
    tags: string[],
  ): { success: boolean; count: number } {
    // In our mock sandbox, we log the bulk update action
    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `media.bulk_update_tags (Assets: ${assetIds.join(', ')}, Tags added: ${tags.join(', ')})`,
      'SUCCESS',
    );

    return { success: true, count: assetIds.length };
  }

  // --- MEDIA STUDIO TRANSFORMER ---
  transformMediaItem(workspaceId: string, body: any): MediaStudioItem {
    const assetId = body.assetId;
    let item = this.data.mediaStudioItems.find(
      (m) => m.id === assetId && m.workspaceId === workspaceId,
    );

    if (!item) {
      item = {
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
      };
      this.data.mediaStudioItems.push(item);
    }

    if (body.aspectRatios) {
      item.aspectRatios = body.aspectRatios;
    }
    if (body.focalPoint) {
      item.focalPoint = body.focalPoint;
    }
    if (body.watermarkPreset !== undefined) {
      item.watermarkPreset = body.watermarkPreset;
    }
    if (body.textOverlay !== undefined) {
      item.textOverlay = body.textOverlay;
    }
    if (body.audioWaveform !== undefined) {
      item.audioWaveform = body.audioWaveform;
    }

    this.saveData();
    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `media.transform (Asset: ${assetId})`,
      'SUCCESS',
    );

    return item;
  }
}
