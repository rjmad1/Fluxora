import { Test, TestingModule } from '@nestjs/testing';
import { BrandComplianceService } from './brand-compliance.service';

describe('BrandComplianceService', () => {
  let complianceService: BrandComplianceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrandComplianceService],
    }).compile();

    complianceService = module.get<BrandComplianceService>(
      BrandComplianceService,
    );
  });

  it('should return compliant: true and score: 100 for clean marketing copy', async () => {
    const result = await complianceService.checkCompliance(
      'Excited to launch our new automated distribution campaign via Fluxora! 🚀 #socialmedia #enterprise',
    );

    expect(result.compliant).toBe(true);
    expect(result.score).toBe(100);
    expect(result.violations).toHaveLength(0);
    expect(result.suggestions).toHaveLength(0);
  });

  it('should flag prohibited words and lower the score', async () => {
    const result = await complianceService.checkCompliance(
      'We are better than competitorX which is unapproved.',
    );

    expect(result.compliant).toBe(true); // Score is 70 which is compliant
    expect(result.score).toBe(70);
    expect(result.violations[0]).toContain('prohibited word');
  });

  it('should flag excessive screaming uppercase content as non-compliant', async () => {
    const result = await complianceService.checkCompliance(
      'ANNOUNCING A BRAND NEW EXTREMELY IMPORTANT UPDATE NOW GO REGISTER IMMEDIATELY!',
    );

    expect(result.compliant).toBe(true);
    expect(result.violations[0]).toContain('uppercase lettering');
  });

  it('should block and return compliant: false for explicit mock violations', async () => {
    const result = await complianceService.checkCompliance(
      'This contains a trigger-compliance-violation and competitorX.',
    );

    expect(result.compliant).toBe(false);
    expect(result.score).toBe(40); // 100 - (30 * 2) = 40
    expect(result.violations).toHaveLength(2);
  });
});
