import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ExtendedFeaturesRepository } from '../../extended-features/extended-features.repository';

export interface ViralityPrediction {
  score: number;
  shifts: string[];
  adjustments: string[];
}

@Injectable()
export class ListeningService {
  private readonly logger = new Logger(ListeningService.name);

  constructor(private readonly repository: ExtendedFeaturesRepository) {}

  // --- SOCIAL LISTENING ---
  async getMentions(workspaceId: string) {
    return this.repository.getMentions(workspaceId);
  }

  async addTrackedKeyword(
    workspaceId: string,
    keyword: string,
  ): Promise<string[]> {
    const settings = await this.repository.getOrCreateSettings(workspaceId);
    if (!settings.trackedKeywords.includes(keyword)) {
      const updatedKeywords = [...settings.trackedKeywords, keyword];
      await this.repository.updateSettings(workspaceId, {
        trackedKeywords: updatedKeywords,
      });
      await this.repository.logAction(
        workspaceId,
        'system',
        `listening.add_keyword (Keyword: "${keyword}")`,
        'SUCCESS',
      );
      return updatedKeywords;
    }
    return settings.trackedKeywords;
  }

  async removeTrackedKeyword(
    workspaceId: string,
    keyword: string,
  ): Promise<string[]> {
    const settings = await this.repository.getOrCreateSettings(workspaceId);
    const updatedKeywords = settings.trackedKeywords.filter(
      (k) => k !== keyword,
    );
    await this.repository.updateSettings(workspaceId, {
      trackedKeywords: updatedKeywords,
    });
    await this.repository.logAction(
      workspaceId,
      'system',
      `listening.remove_keyword (Keyword: "${keyword}")`,
      'SUCCESS',
    );
    return updatedKeywords;
  }

  async convertMentionToTicket(
    workspaceId: string,
    mentionId: string,
  ): Promise<{ ticketId: string }> {
    const res = await this.repository.convertMentionToTicket(
      workspaceId,
      mentionId,
    );
    await this.repository.logAction(
      workspaceId,
      'admin@fluxora.com',
      `brand_mention.convert_ticket (Mention ID: ${mentionId}, Ticket ID: ${res.ticketId})`,
      'SUCCESS',
    );
    return res;
  }

  async getCompetitors(workspaceId: string) {
    return this.repository.getCompetitors(workspaceId);
  }

  // --- SETTINGS HELPER ---
  async getOrCreateSettings(workspaceId: string) {
    return this.repository.getOrCreateSettings(workspaceId);
  }

  // --- SMART TREND & VIRALITY FORECASTING ---
  async getTrendingTopics(workspaceId: string) {
    return this.repository.getTrendingTopics(workspaceId);
  }

  async getViralityPrediction(
    workspaceId: string,
    content: string,
  ): Promise<ViralityPrediction> {
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

    await this.repository.logAction(
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
  async getCompetitorDetails(workspaceId: string) {
    return this.repository.getCompetitorDetails(workspaceId);
  }

  async setupCompetitor(workspaceId: string, competitor: Partial<any>) {
    const newComp = await this.repository.setupCompetitor(
      workspaceId,
      competitor,
    );
    await this.repository.logAction(
      workspaceId,
      'admin@fluxora.com',
      `competitor.setup (Handle: "${newComp.handle}")`,
      'SUCCESS',
    );
    return newComp;
  }
}
