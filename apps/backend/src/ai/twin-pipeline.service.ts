import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { PersonalContextEngineService } from './personal-context-engine.service';
import { PlatformGuard } from '../publishing/platform-guard';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TwinPipelineService {
  private readonly logger = new Logger(TwinPipelineService.name);
  private openaiApiKey = '';
  private geminiApiKey = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly personalContextEngine: PersonalContextEngineService,
    private readonly configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY', '');
  }

  /**
   * Fetches all PENDING_APPROVAL topics for a given workspace.
   */
  async getPendingTopics(workspaceId: string) {
    return this.prisma.proposedTopicState.findMany({
      where: {
        workspaceId,
        status: 'PENDING_APPROVAL',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Pulls user digital twin profile metadata, queries LLM to synthesize 3 topics,
   * and saves them to ProposedTopicState with PENDING_APPROVAL status.
   */
  async triggerAutonomousResearch(workspaceId: string) {
    const context = await this.personalContextEngine.buildPersonalContext(
      'autonomous topic research',
    );

    const systemPrompt = `
You are an expert content strategist and AI Digital Twin.
Based on the following user digital twin profile and positioning guidelines:
${context}

Synthesize exactly 3 distinct content topics that the user should write about. Each topic must have:
1. A catchy title.
2. A brief abstract/description.
3. 1-2 source urls (as an array of strings).

Your response MUST be a valid JSON array of exactly 3 objects, with keys "title", "abstract", and "sourceUrls". Do NOT return any other text, markdown blocks, or explanations.
`;

    let generatedTopicsText = '';

    // Try Gemini
    if (this.geminiApiKey) {
      try {
        this.logger.log('Synthesizing topics via Gemini 1.5 Flash...');
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: systemPrompt }] }],
          },
          { timeout: 5000 },
        );
        generatedTopicsText =
          res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err: any) {
        this.logger.warn(
          `Gemini topic synthesis failed: ${err.message}. Trying OpenAI.`,
        );
      }
    }

    // Try OpenAI
    if (!generatedTopicsText && this.openaiApiKey) {
      try {
        this.logger.log('Synthesizing topics via OpenAI GPT-4o-mini...');
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert content strategist.',
              },
              { role: 'user', content: systemPrompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );
        generatedTopicsText = res.data?.choices?.[0]?.message?.content || '';
      } catch (err: any) {
        this.logger.warn(`OpenAI topic synthesis failed: ${err.message}`);
      }
    }

    let topics: Array<{
      title: string;
      abstract: string;
      sourceUrls: string[];
    }> = [];

    if (generatedTopicsText) {
      try {
        const cleanText = generatedTopicsText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed)) {
          topics = parsed;
        }
      } catch (err: any) {
        this.logger.warn(`Failed to parse topics JSON: ${err.message}`);
      }
    }

    // Fallback simulation if APIs are not configured or failed
    if (topics.length === 0) {
      this.logger.log('Using simulated topics fallback...');
      topics = [
        {
          title: 'Scaling Multi-Tenant Architectures with Row-Level Security',
          abstract:
            'A deep dive into implementing PostgreSQL Row-Level Security (RLS) in NestJS and Prisma to guarantee tenant data isolation.',
          sourceUrls: [
            'https://prisma.io/blog/rls',
            'https://postgresql.org/docs/rls',
          ],
        },
        {
          title: 'Building Resilience in Digital Twin Workflows',
          abstract:
            'How we utilize autonomous agent feedback loops and platform-specific guards to guarantee copy quality across Twitter and LinkedIn.',
          sourceUrls: ['https://fluxora.io/blog/digital-twin'],
        },
        {
          title: 'The Future of Personal Hubs in the Creator Economy',
          abstract:
            'Why digital twin engines are essential for creators to scale their output while preserving their authentic voice profile.',
          sourceUrls: ['https://fluxora.io/blog/personal-hubs'],
        },
      ];
    }

    const createdTopics = [];
    for (const t of topics) {
      const created = await this.prisma.proposedTopicState.create({
        data: {
          workspaceId,
          title: t.title || 'Untitled Topic',
          abstract: t.abstract || 'No description provided.',
          sourceUrls: t.sourceUrls || [],
          status: 'PENDING_APPROVAL',
        },
      });
      createdTopics.push(created);
    }

    return createdTopics;
  }

  /**
   * Updates topic status to ACCEPTED, builds personalized instructions,
   * generates platform-specific content variants, and runs them through PlatformGuard.
   */
  async generateTopicVariants(workspaceId: string, topicId: string) {
    const topic = await this.prisma.proposedTopicState.findFirst({
      where: {
        id: topicId,
        workspaceId,
      },
    });

    if (!topic) {
      throw new NotFoundException('Proposed topic not found');
    }

    // Update status to ACCEPTED
    await this.prisma.proposedTopicState.update({
      where: { id: topicId },
      data: { status: 'ACCEPTED' },
    });

    let twitterContent = '';
    let linkedinContent = '';
    let facebookContent = '';

    // If no API keys are available, run custom fallback simulated generation
    if (!this.geminiApiKey && !this.openaiApiKey) {
      this.logger.log('Running fallback simulated variants generation...');
      twitterContent = `Read about: ${topic.title}. ${topic.abstract.substring(0, 150)}... #tech #innovation`;
      linkedinContent = `### ${topic.title}\n\n${topic.abstract}\n\nKey takeaways:\n- Tailored voice alignment\n- Contextual topic research\n- Cross-platform scaling\n\nRead more at: ${topic.sourceUrls[0] || 'https://fluxora.io'}`;
      facebookContent = `Here is our latest research topic: ${topic.title}.\n\n${topic.abstract}\n\nCheck it out here: ${topic.sourceUrls[0] || 'https://fluxora.io'}`;
    } else {
      try {
        const twitterRes = await this.personalContextEngine.generateContent(
          `Generate a Twitter post variant for the topic: "${topic.title}". Description: "${topic.abstract}". Constraint: Maximum 280 characters, do NOT use markdown. Write in a natural, engaging style.`,
        );
        twitterContent = twitterRes.content;
      } catch (err: any) {
        this.logger.warn(
          `Twitter generation failed, falling back: ${err.message}`,
        );
        twitterContent = `Read about: ${topic.title}. ${topic.abstract.substring(0, 150)}...`;
      }

      try {
        const linkedinRes = await this.personalContextEngine.generateContent(
          `Generate a LinkedIn post variant for the topic: "${topic.title}". Description: "${topic.abstract}". Constraint: Maximum 3000 characters, supports markdown. Write in a professional, thought-provoking style.`,
        );
        linkedinContent = linkedinRes.content;
      } catch (err: any) {
        this.logger.warn(
          `LinkedIn generation failed, falling back: ${err.message}`,
        );
        linkedinContent = `### ${topic.title}\n\n${topic.abstract}`;
      }

      try {
        const facebookRes = await this.personalContextEngine.generateContent(
          `Generate a Facebook post variant for the topic: "${topic.title}". Description: "${topic.abstract}". Constraint: Maximum 5000 characters, do NOT use markdown. Write in an engaging and approachable style.`,
        );
        facebookContent = facebookRes.content;
      } catch (err: any) {
        this.logger.warn(
          `Facebook generation failed, falling back: ${err.message}`,
        );
        facebookContent = `Topic: ${topic.title}\n\n${topic.abstract}`;
      }
    }

    // Apply PlatformGuard validation and formatting rules
    return {
      topicId,
      variants: {
        twitter: PlatformGuard.validateAndProcess('twitter', twitterContent),
        linkedin: PlatformGuard.validateAndProcess('linkedin', linkedinContent),
        facebook: PlatformGuard.validateAndProcess('facebook', facebookContent),
      },
    };
  }
}
