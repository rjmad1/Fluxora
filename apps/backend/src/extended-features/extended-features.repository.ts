import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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
  trendRate: number;
  historicalEngagement: number;
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
  rules: string[];
  matchCount: number;
}

export interface TopicWeight {
  workspaceId: string;
  category: string;
  weight: number;
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

export interface SandboxData {
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
export class ExtendedFeaturesRepository {
  private readonly logger = new Logger(ExtendedFeaturesRepository.name);
  private readonly filePath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    process.env.JEST_WORKER_ID
      ? `extended-features-sandbox-${process.env.JEST_WORKER_ID}.json`
      : 'extended-features-sandbox.json',
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
    if (!this.data.mentions || this.data.mentions.length === 0) {
      this.initializeMockData();
      this.saveData();
    }
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
        const fileContent = fs.readFileSync(this.filePath, 'utf-8').trim();
        if (fileContent) {
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
        }
      }
    } catch (error) {
      this.logger.error('Failed to load sandbox data in repository:', error);
    }
  }

  saveData() {
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.data, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('Failed to write sandbox data from repository:', error);
    }
  }

  getData(): SandboxData {
    return this.data;
  }

  private initializeMockData() {
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
        expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
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
}
