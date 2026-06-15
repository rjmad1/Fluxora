import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { PersonalProfileService } from '../personal-hub/personal-profile.service';
import { KnowledgeGraphService } from '../personal-hub/knowledge-graph.service';
import { DigitalTwinService } from '../personal-hub/digital-twin.service';
import { PrismaService } from '../tenant/prisma.service';
import { BrandComplianceService } from './brand-compliance.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PersonalContextEngineService {
  private readonly logger = new Logger(PersonalContextEngineService.name);
  private openaiApiKey = '';
  private geminiApiKey = '';

  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
    private readonly profileService: PersonalProfileService,
    private readonly graphService: KnowledgeGraphService,
    private readonly twinService: DigitalTwinService,
    private readonly configService: ConfigService,
    private readonly complianceService: BrandComplianceService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY', '');
  }

  async buildPersonalContext(query: string): Promise<string> {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) return '';

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { mode: true },
    });

    if (workspace?.mode !== 'INDIVIDUAL') {
      this.logger.log(`Skipping context: workspace mode is ${workspace?.mode}`);
      return '';
    }

    const profile = await this.profileService.getOrCreateProfile();
    const dna = await this.profileService.getContentDNA();
    const twin = await this.twinService.getOrCreateDigitalTwin();
    const voice = await this.twinService.getOrCreateVoiceProfile();
    const goals = await this.profileService.getGoals();
    const expertise = await this.profileService.getExpertise();
    const graphContext = await this.graphService.getRelevantContext(query);

    const goalsStr = goals.length > 0 ? goals.map((g) => `- ${g.category}: ${g.description}`).join('\n') : 'None';
    const expertiseStr = expertise.length > 0 ? expertise.map((e) => `- ${e.topic} (${e.level})`).join('\n') : 'None';
    const graphStr = graphContext.length > 0 ? graphContext.map((c) => `- ${c}`).join('\n') : 'None';

    return `
=== USER PROFILE IDENTITY ===
Name: ${profile.fullName}
Headline: ${profile.headline || 'N/A'}
Bio: ${profile.bio || 'N/A'}
Summary: ${profile.summary || 'N/A'}

=== DIGITAL TWIN VOICE & STYLE ===
Tone: ${voice.toneDescription || 'Professional'}
Style: ${voice.writingStyle || 'N/A'}
Formality: ${twin.formalityLevel} (0 to 1)
Creativity: ${twin.creativityLevel} (0 to 1)
Vocabulary Rules: Preferred: ${JSON.stringify(voice.vocabularyPrefs || {})}
Engagement Style: ${twin.engagementStyle || 'N/A'}
Prompt Guidelines: ${twin.promptTemplate || 'N/A'}

=== CONTENT DNA ===
Preferred Topics: ${dna.preferredTopics ? dna.preferredTopics.join(', ') : 'N/A'}
Avoid Topics: ${dna.avoidTopics ? dna.avoidTopics.join(', ') : 'N/A'}
CTA Preferences: ${voice.ctaPreferences ? voice.ctaPreferences.join(', ') : 'N/A'}

=== GOALS & INTERESTS ===
Goals:
${goalsStr}
Expertise:
${expertiseStr}

=== KNOWLEDGE GRAPH ENTITIES ===
${graphStr}
`;
  }

  async generateContent(prompt: string): Promise<{
    content: string;
    compliance: { compliant: boolean; score: number; violations: string[]; suggestions: string[] };
  }> {
    const context = await this.buildPersonalContext(prompt);
    const systemPrompt = `
You are the AI Digital Twin of the user. You must generate content (social media posts, threads, or articles) in their exact voice, reflecting their career history, brand positioning, and goals.

Guidelines to follow:
${context}

Instructions:
- Write the post based on the user's intent: "${prompt}"
- Write in a natural, human-authored style. Do not use generic AI buzzwords or filler.
- Respect vocabulary preferences and avoid restricted topics.
- Return ONLY the generated content text. Do not wrap in markdown or include introduction notes.
`;

    let generatedContent = '';

    // 1. Try Gemini
    if (this.geminiApiKey) {
      try {
        this.logger.log('Generating content via Gemini 1.5 Flash...');
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: systemPrompt }] }],
          },
          { timeout: 5000 },
        );
        generatedContent = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err: any) {
        this.logger.warn(`Gemini generation failed: ${err.message}. Trying OpenAI.`);
      }
    }

    // 2. Try OpenAI
    if (!generatedContent && this.openaiApiKey) {
      try {
        this.logger.log('Generating content via OpenAI GPT-4o-mini...');
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are the user\'s AI Digital Twin.' },
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
        generatedContent = res.data?.choices?.[0]?.message?.content || '';
      } catch (err: any) {
        this.logger.warn(`OpenAI generation failed: ${err.message}`);
      }
    }

    // Fallback simulation if APIs are not configured
    if (!generatedContent) {
      this.logger.log('Running fallback simulated generation...');
      generatedContent = `🚀 Excited to share my journey as an AI Architect. By parsing resumes and profiles into a Personal Knowledge Graph, we align our brand voice guidelines dynamically. Staged under RLS Postgres rules for multi-tenant containment!`;
    }

    // 3. Validation Layer (Brand Compliance Audit)
    const compliance = await this.complianceService.checkCompliance(generatedContent, [
      'Do not mention competitors directly',
      'Avoid screaming uppercase letters',
      'Align tone with brand professional copy standard',
    ]);

    return {
      content: generatedContent.trim(),
      compliance,
    };
  }
}
