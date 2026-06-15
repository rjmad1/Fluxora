import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BrandComplianceService {
  private readonly logger = new Logger(BrandComplianceService.name);

  async checkCompliance(
    content: string,
    _brandGuidelines: string[] = [],
  ): Promise<{
    compliant: boolean;
    score: number;
    violations: string[];
    suggestions: string[];
  }> {
    this.logger.log(
      `Evaluating copy compliance for content length ${content.length}`,
    );

    const violations: string[] = [];
    const suggestions: string[] = [];

    // Rule 1: Banned terminology or competitive mentions
    const prohibitedWords = ['competitorx', 'unauthorized-leak', 'banned-word'];
    prohibitedWords.forEach((word) => {
      if (content.toLowerCase().includes(word)) {
        violations.push(`Contains prohibited word/brand mention: "${word}"`);
        suggestions.push(
          `Remove reference to "${word}" to align with brand memory compliance policies.`,
        );
      }
    });

    // Rule 2: Excessive uppercase screaming
    const upperCount = content.replace(/[^A-Z]/g, '').length;
    if (content.length > 10 && upperCount / content.length > 0.5) {
      violations.push(
        'Text contains excessive uppercase lettering (screaming).',
      );
      suggestions.push('Format text with standard capitalization rules.');
    }

    // Rule 3: Forced mock trigger to verify compliance gates
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
