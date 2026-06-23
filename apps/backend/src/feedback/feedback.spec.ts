import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../tenant/prisma.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prisma: PrismaService;

  const mockPrismaService = {
    feedbackReport: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: 'mock-report-id',
        ...data,
      })),
      findUnique: jest.fn().mockImplementation(({ where }) => ({
        id: where.id,
        title: 'Mock Error report',
        description: 'App crashes on load with error',
        priority: 'MEDIUM',
        status: 'OPEN',
      })),
      update: jest.fn().mockImplementation(({ where, data }) => ({
        id: where.id,
        ...data,
      })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create feedback and queue triage task', async () => {
    const dto = {
      type: 'BUG' as const,
      title: 'Navigation fails',
      description: 'Clicking the settings page results in connection warning',
      url: 'http://localhost/settings',
      metadata: {},
    };

    const res = await service.createFeedback(dto, 'workspace-1');
    expect(res).toBeDefined();
    expect(res.reportId).toBe('mock-report-id');
    expect(res.status).toBe('OPEN');
    expect(prisma.feedbackReport.create).toHaveBeenCalled();
  });
});
