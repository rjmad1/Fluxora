import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface SocialMention {
  id: string;
  content: string;
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  timestamp: string;
}

export interface CompetitorData {
  handle: string;
  followers: number;
  engagementRate: number;
  shareOfVoice: number;
}

export interface ISocialListeningProvider {
  fetchMentions(keywords: string[]): Promise<SocialMention[]>;
  fetchCompetitorMetrics(handle: string): Promise<CompetitorData>;
}

@Injectable()
export class MockMentionProvider implements ISocialListeningProvider {
  async fetchMentions(keywords: string[]): Promise<SocialMention[]> {
    if (!keywords || keywords.length === 0) return [];

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return realistic mocked data based on keywords
    return keywords.flatMap((keyword) => [
      {
        id: crypto.randomUUID(),
        content: `Just started using ${keyword} and it is amazing! The team did a great job.`,
        platform: 'twitter',
        sentiment: 'positive',
        source: '@tech_guru',
        timestamp: new Date(
          Date.now() - Math.random() * 86400000,
        ).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        content: `Having some issues with ${keyword} integration. Documentation is a bit sparse.`,
        platform: 'linkedin',
        sentiment: 'negative',
        source: 'Sarah Dev',
        timestamp: new Date(
          Date.now() - Math.random() * 86400000,
        ).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        content: `Checking out the new features in ${keyword} release.`,
        platform: 'facebook',
        sentiment: 'neutral',
        source: 'DevNews',
        timestamp: new Date(
          Date.now() - Math.random() * 86400000,
        ).toISOString(),
      },
    ]);
  }

  async fetchCompetitorMetrics(handle: string): Promise<CompetitorData> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate deterministic mock data based on handle string length/chars
    const hash = handle
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
      handle,
      followers: 10000 + hash * 100,
      engagementRate: 1.5 + (hash % 50) / 10,
      shareOfVoice: 10 + (hash % 30),
    };
  }
}
