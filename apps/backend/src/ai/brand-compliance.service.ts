import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class BrandComplianceService {
  private readonly logger = new Logger(BrandComplianceService.name);
  private openaiApiKey = '';
  private geminiApiKey = '';
  private qdrantUrl = '';

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.qdrantUrl = this.configService.get<string>('QDRANT_URL', '');
  }

  async checkCompliance(
    content: string,
    brandGuidelines: string[] = [],
  ): Promise<{
    compliant: boolean;
    score: number;
    violations: string[];
    suggestions: string[];
  }> {
    this.logger.log(
      `Evaluating copy compliance for content length ${content.length}`,
    );

    // Retrieve active guidelines from Qdrant if available
    let dynamicGuidelines = [...brandGuidelines];
    if (this.qdrantUrl) {
      try {
        this.logger.log(`Searching Qdrant collection for guidelines: ${this.qdrantUrl}`);
        const qdrantRes = await axios.post(
          `${this.qdrantUrl}/collections/brand_guidelines/points/search`,
          {
            vector: Array(1536).fill(0.0), // Mock vector for general search
            limit: 5,
            with_payload: true,
          },
          { timeout: 1500 },
        );
        const points = qdrantRes.data?.result || [];
        points.forEach((p: any) => {
          if (p.payload?.guideline) {
            dynamicGuidelines.push(p.payload.guideline);
          }
        });
      } catch (err: any) {
        this.logger.warn(`Qdrant search failed: ${err.message}. Relying on passed guidelines.`);
      }
    }

    if (dynamicGuidelines.length === 0) {
      dynamicGuidelines = [
        'Do not mention competitors directly',
        'Avoid screaming uppercase letters',
        'Align tone with brand professional copy standard',
      ];
    }

    // 1. Try Gemini API
    if (this.geminiApiKey) {
      try {
        this.logger.log('Executing brand compliance check via Gemini 1.5 Flash...');
        const prompt = `
          You are a brand compliance auditor. Evaluate the following social media post content against these brand guidelines.
          
          Guidelines:
          ${dynamicGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}
          
          Post Content:
          "${content}"
          
          Return your response strictly in JSON format. Do not wrap in markdown blocks. The JSON must match this structure:
          {
            "compliant": boolean,
            "score": number (0 to 100),
            "violations": ["string describing specific guideline violations"],
            "suggestions": ["string suggesting how to fix violations"]
          }
        `;

        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          },
          { timeout: 5000 },
        );

        const textResponse = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(textResponse);
        return {
          compliant: parsed.compliant ?? true,
          score: parsed.score ?? 100,
          violations: parsed.violations ?? [],
          suggestions: parsed.suggestions ?? [],
        };
      } catch (err: any) {
        this.logger.error(`Gemini brand compliance audit failed: ${err.message}. Falling back.`);
      }
    }

    // 2. Try OpenAI API
    if (this.openaiApiKey) {
      try {
        this.logger.log('Executing brand compliance check via OpenAI...');
        const prompt = `
          Evaluate the following social media post content against these guidelines.
          Guidelines:
          ${dynamicGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}
          
          Post Content:
          "${content}"
        `;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are a brand compliance auditor. Analyze the user content and return a JSON containing keys: compliant (boolean), score (number 0-100), violations (string array), and suggestions (string array).',
              },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );

        const textResponse = response.data?.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(textResponse);
        return {
          compliant: parsed.compliant ?? true,
          score: parsed.score ?? 100,
          violations: parsed.violations ?? [],
          suggestions: parsed.suggestions ?? [],
        };
      } catch (err: any) {
        this.logger.error(`OpenAI brand compliance audit failed: ${err.message}. Falling back.`);
      }
    }

    // 3. Rule-based offline / sandbox fallback
    this.logger.log('Running rule-based local compliance heuristics (Fallback Mode)...');
    const violations: string[] = [];
    const suggestions: string[] = [];

    const prohibitedWords = ['competitorx', 'unauthorized-leak', 'banned-word'];
    prohibitedWords.forEach((word) => {
      if (content.toLowerCase().includes(word)) {
        violations.push(`Contains prohibited word/brand mention: "${word}"`);
        suggestions.push(
          `Remove reference to "${word}" to align with brand memory compliance policies.`,
        );
      }
    });

    const upperCount = content.replace(/[^A-Z]/g, '').length;
    if (content.length > 10 && upperCount / content.length > 0.5) {
      violations.push(
        'Text contains excessive uppercase lettering (screaming).',
      );
      suggestions.push('Format text with standard capitalization rules.');
    }

    if (content.includes('trigger-compliance-violation')) {
      violations.push('Manually triggered compliance block for testing.');
      suggestions.push('Remove the compliance trigger string.');
    }

    const score =
      violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 30);
    const compliant = score >= 70;

    this.logger.log(
      `Compliance check completed. Score: ${score}, Compliant: ${compliant}`,
    );

    return {
      compliant,
      score,
      violations,
      suggestions,
    };
  }
}
