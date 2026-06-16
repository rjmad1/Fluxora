import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ExtendedFeaturesRepository,
  BrandMention,
  Competitor,
  TrendingTopic,
  CompetitorPost,
  CompetitorMix,
  CompetitorFrequency,
  WorkspaceSettings,
  AuditLog,
} from '../../extended-features/extended-features.repository';
import { ViralityPrediction } from '../../extended-features/extended-features.service';

@Injectable()
export class ListeningService {
  private readonly logger = new Logger(ListeningService.name);

  constructor(private readonly repository: ExtendedFeaturesRepository) {}

  private get data() {
    return this.repository.getData();
  }

  private saveData() {
    this.repository.saveData();
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
      throw new BadRequestException('Mention not found');
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
}
