import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

interface SandboxData {
  mentions: BrandMention[];
  competitors: Competitor[];
  templates: PostTemplate[];
  leaderboard: LeaderboardEntry[];
  abTests: ABTest[];
  shortenedLinks: ShortenedLink[];
  auditLogs: AuditLog[];
  settings: Record<string, WorkspaceSettings>;
  trendingTopics: TrendingTopic[];
  competitorPosts: CompetitorPost[];
  competitorMixes: CompetitorMix[];
  competitorFrequencies: CompetitorFrequency[];
  inboxMessages: InboxMessage[];
  taxonomyTags: TaxonomyTag[];
  autoCollections: AutoCollection[];
  topicWeights: TopicWeight[];
  mediaStudioItems: MediaStudioItem[];
}

@Injectable()
export class ExtendedFeaturesService {
  private readonly logger = new Logger(ExtendedFeaturesService.name);
  private readonly filePath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'extended-features-sandbox.json',
  );

  private data: SandboxData = {
    mentions: [],
    competitors: [],
    templates: [],
    leaderboard: [],
    abTests: [],
    shortenedLinks: [],
    auditLogs: [],
    settings: {},
    trendingTopics: [],
    competitorPosts: [],
    competitorMixes: [],
    competitorFrequencies: [],
    inboxMessages: [],
    taxonomyTags: [],
    autoCollections: [],
    topicWeights: [],
    mediaStudioItems: [],
  };

  constructor() {
    this.ensureDirectoryExists();
    this.loadData();
  }

  private ensureDirectoryExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          mentions: parsed.mentions || [],
          competitors: parsed.competitors || [],
          templates: parsed.templates || [],
          leaderboard: parsed.leaderboard || [],
          abTests: parsed.abTests || [],
          shortenedLinks: parsed.shortenedLinks || [],
          auditLogs: parsed.auditLogs || [],
          settings: parsed.settings || {},
          trendingTopics: parsed.trendingTopics || [],
          competitorPosts: parsed.competitorPosts || [],
          competitorMixes: parsed.competitorMixes || [],
          competitorFrequencies: parsed.competitorFrequencies || [],
          inboxMessages: parsed.inboxMessages || [],
          taxonomyTags: parsed.taxonomyTags || [],
          autoCollections: parsed.autoCollections || [],
          topicWeights: parsed.topicWeights || [],
          mediaStudioItems: parsed.mediaStudioItems || [],
        };
        // If the parsed data did not have the new arrays, populate them with defaults and save
        if (!parsed.trendingTopics || parsed.trendingTopics.length === 0) {
          this.initializeMockData();
          this.saveData();
        }
      } else {
        this.initializeMockData();
        this.saveData();
      }
    } catch (error) {
      this.logger.error(
        'Failed to load sandbox data, using in-memory defaults:',
        error,
      );
      this.initializeMockData();
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.data, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('Failed to write sandbox data:', error);
    }
  }

  private initializeMockData() {
    // We will initialize rich and realistic seed data
    const ws1 = 'ws-1';
    const ws2 = 'ws-2';

    // Seed Mentions
    this.data.mentions = [
      {
        id: 'men-1',
        workspaceId: ws1,
        content:
          'Fluxora platform is incredibly fast! Migrated our telemetry and saw analytics load in <500ms.',
        platform: 'twitter',
        sentiment: 'positive',
        source: '@dev_ops_jane',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
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
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
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
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        ticketCreated: false,
      },
    ];

    // Seed Competitors
    this.data.competitors = [
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

    // Seed Templates
    this.data.templates = [
      {
        id: 'tpl-1',
        workspaceId: ws1,
        title: 'Enterprise Scalability Launch',
        content:
          'Thrilled to unveil our high-throughput telemetry stream powered by Kafka and ClickHouse! Real-time aggregates in under 500ms ⚡ #BigData #Scale',
        category: 'Product Launch',
        author: 'Admin Team',
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
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
        expiresAt: new Date(Date.now() + 86400000 * 15).toISOString(),
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
        expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(), // Expires soon
        sharedCount: 5,
      },
    ];

    // Seed Leaderboard
    this.data.leaderboard = [
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
    ];

    // Seed ABTests
    this.data.abTests = [
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
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
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
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ];

    // Seed Shortened Links
    this.data.shortenedLinks = [
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
        retargetingPixels: { meta: 'px-meta-9092', google: 'aw-google-112' },
        geoClicks: { US: 450, GB: 120, DE: 82, CA: 64, IN: 126 },
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
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
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
    ];

    // Seed Audit Logs
    this.data.auditLogs = [
      {
        id: 'log-1',
        workspaceId: ws1,
        actor: 'superadmin@fluxora.com',
        action: '2fa.enforce_global',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'SUCCESS',
      },
      {
        id: 'log-2',
        workspaceId: ws1,
        actor: 'manager@fluxora.com',
        action: 'digest.configure_wizard',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        status: 'SUCCESS',
      },
      {
        id: 'log-3',
        workspaceId: ws1,
        actor: 'agent@fluxora.com',
        action:
          'compliance.keyword_flagged (Post Content contains: "guaranteed return")',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'WARNING',
      },
      {
        id: 'log-4',
        workspaceId: ws1,
        actor: 'admin@fluxora.com',
        action: 'brand_mention.convert_ticket (ID: men-2)',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'SUCCESS',
      },
    ];

    // Seed settings
    this.data.settings[ws1] = {
      workspaceId: ws1,
      twoFactorEnabled: false,
      retentionDays: 90,
      trackedKeywords: ['Fluxora', 'telemetry', 'ClickHouse', 'Postgres RLS'],
      emailDigest: {
        enabled: true,
        frequency: 'weekly',
        day: 'Friday',
        time: '09:00',
      },
    };

    this.data.settings[ws2] = {
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
    };

    // Seed Trending Topics
    this.data.trendingTopics = [
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
        id: 'trend-3',
        workspaceId: ws1,
        niche: 'Finance',
        topic: 'SaaS Churn Reduction',
        volume: 14500,
        trendRate: 8,
        historicalEngagement: 2.8,
      },
      {
        id: 'trend-4',
        workspaceId: ws1,
        niche: 'Lifestyle',
        topic: 'Remote Work Fatigue Hacks',
        volume: 88100,
        trendRate: -5,
        historicalEngagement: 5.1,
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
    ];

    // Seed Competitor Posts & Metadata
    this.data.competitorPosts = [
      {
        id: 'cp-1',
        competitorId: 'comp-1',
        content:
          'Our new Postgres vs ClickHouse benchmarking highlights 10x throughput gains on real-time event streaming!',
        engagementType: 'likes',
        engagementCount: 1420,
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'cp-2',
        competitorId: 'comp-1',
        content:
          'Introducing simple templates for employee advocacy programs in Slack & MS Teams.',
        engagementType: 'shares',
        engagementCount: 320,
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: 'cp-3',
        competitorId: 'comp-2',
        content:
          'Are you looking for a Senior SRE role? We are expanding our scaling infrastructure team!',
        engagementType: 'comments',
        engagementCount: 189,
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 'cp-4',
        competitorId: 'comp-3',
        content:
          'Tips to avoid compliance alerts and RLS policy locks on multi-tenant databases.',
        engagementType: 'likes',
        engagementCount: 940,
        timestamp: new Date(Date.now() - 3600000 * 15).toISOString(),
      },
    ];

    this.data.competitorMixes = [
      { competitorId: 'comp-1', video: 40, image: 45, text: 15 },
      { competitorId: 'comp-2', video: 20, image: 50, text: 30 },
      { competitorId: 'comp-3', video: 60, image: 30, text: 10 },
    ];

    this.data.competitorFrequencies = [
      {
        competitorId: 'comp-1',
        frequency: '4 posts/day',
        pattern: '9AM, 1PM, 5PM, 9PM EST',
      },
      {
        competitorId: 'comp-2',
        frequency: '2 posts/day',
        pattern: '10AM and 3PM EST',
      },
      {
        competitorId: 'comp-3',
        frequency: '5 posts/day',
        pattern: 'Every 3 hours starting 8AM',
      },
    ];

    // Seed Community Inbox DMs/Comments/Reviews
    this.data.inboxMessages = [
      {
        id: 'msg-1',
        workspaceId: ws1,
        platform: 'linkedin',
        type: 'comment',
        sender: 'David Chen',
        body: 'How does the Kafka fallback behavior handle partitioned queue offline events? Is there a local disk spooling queue?',
        sentiment: 'neutral',
        assignedTo: 'Elena Rostova',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
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
        body: 'Just checked out the scaling simulator, absolutely incredible performance dashboards! The transition animations are gorgeous.',
        sentiment: 'positive',
        assignedTo: 'Sarah Jenkins',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        replies: [],
      },
      {
        id: 'msg-3',
        workspaceId: ws1,
        platform: 'facebook',
        type: 'review',
        sender: 'Security Auditor Team',
        body: 'Found potential token refresh warning errors in the audit trail during maintenance mode. Is RLS fully separating workspace connections?',
        sentiment: 'negative',
        assignedTo: 'Alex Mercer',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        replies: [],
      },
    ];

    // Seed Taxonomy Tags & Collections
    this.data.taxonomyTags = [
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
      {
        id: 'tag-3',
        workspaceId: ws1,
        name: 'security',
        color: '#10B981',
        description: 'Keycloak authentication and tenant isolation policies',
      },
      {
        id: 'tag-4',
        workspaceId: ws1,
        name: 'temporal',
        color: '#EF4444',
        description: 'Stateful background workflows',
      },
    ];

    this.data.autoCollections = [
      {
        id: 'col-1',
        workspaceId: ws1,
        name: 'Analytical Databases',
        rules: ['tag:clickhouse'],
        matchCount: 1,
      },
      {
        id: 'col-2',
        workspaceId: ws1,
        name: 'Streaming Infrastructure',
        rules: ['tag:kafka', 'tag:temporal'],
        matchCount: 2,
      },
    ];

    this.data.topicWeights = [
      { workspaceId: ws1, category: 'Technical Architectures', weight: 45 },
      { workspaceId: ws1, category: 'Product Releases', weight: 35 },
      { workspaceId: ws1, category: 'Hiring & Culture', weight: 20 },
    ];

    this.data.mediaStudioItems = [
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
    ];
  }

  // --- SOCIAL LISTENING ---
  getMentions(workspaceId: string): BrandMention[] {
    return this.data.mentions.filter((m) => m.workspaceId === workspaceId);
  }

  addTrackedKeyword(workspaceId: string, keyword: string): string[] {
    const settings = this.getOrCreateSettings(workspaceId);
    if (!settings.trackedKeywords.includes(keyword)) {
      settings.trackedKeywords.push(keyword);
      this.saveData();
      this.logAction(
        workspaceId,
        'system',
        `listening.add_keyword (Keyword: "${keyword}")`,
        'SUCCESS',
      );
    }
    return settings.trackedKeywords;
  }

  removeTrackedKeyword(workspaceId: string, keyword: string): string[] {
    const settings = this.getOrCreateSettings(workspaceId);
    settings.trackedKeywords = settings.trackedKeywords.filter(
      (k) => k !== keyword,
    );
    this.saveData();
    this.logAction(
      workspaceId,
      'system',
      `listening.remove_keyword (Keyword: "${keyword}")`,
      'SUCCESS',
    );
    return settings.trackedKeywords;
  }

  convertMentionToTicket(
    workspaceId: string,
    mentionId: string,
  ): { ticketId: string } {
    const mention = this.data.mentions.find(
      (m) => m.id === mentionId && m.workspaceId === workspaceId,
    );
    if (!mention) {
      throw new Error('Mention not found');
    }

    const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    mention.ticketCreated = true;
    mention.ticketId = ticketId;
    this.saveData();

    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `brand_mention.convert_ticket (Mention ID: ${mentionId}, Ticket ID: ${ticketId})`,
      'SUCCESS',
    );

    return { ticketId };
  }

  getCompetitors(workspaceId: string): Competitor[] {
    return this.data.competitors.filter((c) => c.workspaceId === workspaceId);
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

  // --- SMART TREND & VIRALITY FORECASTING ---
  getTrendingTopics(workspaceId: string): TrendingTopic[] {
    return this.data.trendingTopics.filter(
      (t) => t.workspaceId === workspaceId,
    );
  }

  getViralityPrediction(
    workspaceId: string,
    content: string,
  ): ViralityPrediction {
    // Basic heuristic to calculate score
    let score = 55;
    const shifts: string[] = [
      'Short-form vertical video aspect ratio optimization preference (+15%)',
      'Text formatting readability shifts (+10%)',
      'Direct link embedding priority changes (-5%)',
    ];
    const adjustments: string[] = [];

    if (content.length > 200) {
      score -= 10;
      adjustments.push(
        'Truncate content to under 200 characters to prevent visual cutoff on mobile feeds.',
      );
    } else {
      score += 10;
    }

    if (content.includes('#')) {
      score += 5;
    } else {
      adjustments.push(
        'Add at least 2 relevant hashtag keywords to boost platform indexing discoverability.',
      );
    }

    if (content.includes('http') || content.includes('{link}')) {
      score -= 5;
      adjustments.push(
        'Place links in the first comment thread rather than the post body to bypass platform penalties.',
      );
    }

    if (
      content.includes('🚀') ||
      content.includes('⚡') ||
      content.includes('🔥')
    ) {
      score += 8;
    } else {
      adjustments.push(
        'Inject high-energy action emojis to increase CTR and reader engagement.',
      );
    }

    score = Math.min(Math.max(score, 10), 99);

    this.logAction(
      workspaceId,
      'system',
      `virality.predict (Draft: "${content.substring(0, 30)}...", Score: ${score}%)`,
      'SUCCESS',
    );

    return {
      score,
      shifts,
      adjustments,
    };
  }

  // --- SMART COMPETITOR INTEL ---
  getCompetitorDetails(workspaceId: string): {
    posts: CompetitorPost[];
    mixes: CompetitorMix[];
    frequencies: CompetitorFrequency[];
  } {
    const competitors = this.getCompetitors(workspaceId);
    const competitorIds = competitors.map((c) => c.id);

    return {
      posts: this.data.competitorPosts.filter((p) =>
        competitorIds.includes(p.competitorId),
      ),
      mixes: this.data.competitorMixes.filter((m) =>
        competitorIds.includes(m.competitorId),
      ),
      frequencies: this.data.competitorFrequencies.filter((f) =>
        competitorIds.includes(f.competitorId),
      ),
    };
  }

  setupCompetitor(
    workspaceId: string,
    competitor: Partial<Competitor>,
  ): Competitor {
    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
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
    };

    this.data.competitors.push(newComp);

    // Mock Mix
    this.data.competitorMixes.push({
      competitorId: newComp.id,
      video: 30,
      image: 50,
      text: 20,
    });

    // Mock Frequency
    this.data.competitorFrequencies.push({
      competitorId: newComp.id,
      frequency: '2 posts/day',
      pattern: 'Morning / Afternoon spikes',
    });

    // Mock top posts
    this.data.competitorPosts.push({
      id: `cp-${Date.now()}`,
      competitorId: newComp.id,
      content: `Check out our new tool launch at ${newComp.handle}! Feedback appreciated.`,
      engagementType: 'likes',
      engagementCount: Math.floor(100 + Math.random() * 2000),
      timestamp: new Date().toISOString(),
    });

    this.saveData();

    this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `competitor.setup (Handle: "${newComp.handle}")`,
      'SUCCESS',
    );

    return newComp;
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
