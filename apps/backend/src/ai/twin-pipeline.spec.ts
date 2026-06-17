import { Test, TestingModule } from '@nestjs/testing';
import { TwinPipelineService } from './twin-pipeline.service';
import { PrismaService } from '../tenant/prisma.service';
import { PersonalContextEngineService } from './personal-context-engine.service';
import { ConfigService } from '@nestjs/config';
import { PlatformGuard } from '../publishing/platform-guard';
import { NotFoundException } from '@nestjs/common';

describe('TwinPipelineService & PlatformGuard', () => {
  let service: TwinPipelineService;
  let prismaService: PrismaService;
  let contextEngine: PersonalContextEngineService;

  const mockPrisma = {
    proposedTopicState: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockContextEngine = {
    buildPersonalContext: jest
      .fn()
      .mockResolvedValue('Mocked digital twin voice: professional'),
    generateContent: jest.fn().mockImplementation((prompt: string) => {
      if (prompt.includes('Twitter')) {
        return Promise.resolve({
          content:
            'Mocked Twitter variant: **Great** topic about NestJS! #nest',
          compliance: {
            compliant: true,
            score: 1.0,
            violations: [],
            suggestions: [],
          },
        });
      }
      if (prompt.includes('LinkedIn')) {
        return Promise.resolve({
          content:
            'Mocked LinkedIn variant: **Great** topic about NestJS! #nest',
          compliance: {
            compliant: true,
            score: 1.0,
            violations: [],
            suggestions: [],
          },
        });
      }
      return Promise.resolve({
        content: 'Mocked Facebook variant: **Great** topic about NestJS! #nest',
        compliance: {
          compliant: true,
          score: 1.0,
          violations: [],
          suggestions: [],
        },
      });
    }),
  };

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string, defaultVal: any) => {
      if (key === 'GEMINI_API_KEY') return 'mock-gemini-key';
      if (key === 'OPENAI_API_KEY') return 'mock-openai-key';
      return defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwinPipelineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PersonalContextEngineService, useValue: mockContextEngine },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TwinPipelineService>(TwinPipelineService);
    prismaService = module.get<PrismaService>(PrismaService);
    contextEngine = module.get<PersonalContextEngineService>(
      PersonalContextEngineService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PlatformGuard', () => {
    it('should strip markdown for Twitter and enforce 280 char limit', () => {
      const markdownText =
        'This is a **bold** and *italic* post with `code` block. Limit is 280.';
      const processed = PlatformGuard.validateAndProcess(
        'twitter',
        markdownText,
      );
      expect(processed).not.toContain('**');
      expect(processed).not.toContain('*');
      expect(processed).not.toContain('`');
      expect(processed).toBe(
        'This is a bold and italic post with code block. Limit is 280.',
      );

      const longText = 'a'.repeat(300);
      const trimmed = PlatformGuard.validateAndProcess('twitter', longText);
      expect(trimmed.length).toBe(280);
    });

    it('should preserve markdown for LinkedIn and enforce 3000 char limit', () => {
      const markdownText =
        'This is a **bold** and *italic* post with `code` block.';
      const processed = PlatformGuard.validateAndProcess(
        'linkedin',
        markdownText,
      );
      expect(processed).toContain('**bold**');
      expect(processed).toContain('*italic*');
      expect(processed).toContain('`code`');

      const longText = 'a'.repeat(3100);
      const trimmed = PlatformGuard.validateAndProcess('linkedin', longText);
      expect(trimmed.length).toBe(3000);
    });

    it('should strip markdown for Facebook and enforce 5000 char limit', () => {
      const markdownText =
        'This is a **bold** and *italic* post with `code` block.';
      const processed = PlatformGuard.validateAndProcess(
        'facebook',
        markdownText,
      );
      expect(processed).not.toContain('**');
      expect(processed).not.toContain('*');
      expect(processed).not.toContain('`');

      const longText = 'a'.repeat(5100);
      const trimmed = PlatformGuard.validateAndProcess('facebook', longText);
      expect(trimmed.length).toBe(5000);
    });
  });

  describe('TwinPipelineService - triggerAutonomousResearch', () => {
    it('should query LLM, synthesize and save exactly 3 topics in PENDING_APPROVAL status', async () => {
      mockPrisma.proposedTopicState.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'topic-id', ...data }),
      );

      const result = await service.triggerAutonomousResearch('workspace-123');

      expect(result.length).toBe(3);
      expect(mockContextEngine.buildPersonalContext).toHaveBeenCalled();
      expect(mockPrisma.proposedTopicState.create).toHaveBeenCalledTimes(3);

      result.forEach((topic) => {
        expect(topic.workspaceId).toBe('workspace-123');
        expect(topic.status).toBe('PENDING_APPROVAL');
        expect(topic.title).toBeDefined();
        expect(topic.abstract).toBeDefined();
        expect(topic.sourceUrls).toBeDefined();
      });
    });
  });

  describe('TwinPipelineService - getPendingTopics', () => {
    it('should return pending topics for workspace', async () => {
      const pendingTopics = [
        { id: '1', title: 'Topic 1', status: 'PENDING_APPROVAL' },
        { id: '2', title: 'Topic 2', status: 'PENDING_APPROVAL' },
      ];
      mockPrisma.proposedTopicState.findMany.mockResolvedValue(pendingTopics);

      const result = await service.getPendingTopics('workspace-123');

      expect(result).toEqual(pendingTopics);
      expect(mockPrisma.proposedTopicState.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-123', status: 'PENDING_APPROVAL' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('TwinPipelineService - generateTopicVariants', () => {
    it('should update status to ACCEPTED and generate platform-specific content variants', async () => {
      const mockTopic = {
        id: 'topic-123',
        workspaceId: 'workspace-123',
        title: 'Prisma Client RLS',
        abstract: 'Detailed tutorial on PostgreSQL RLS.',
        sourceUrls: ['https://prisma.io'],
        status: 'PENDING_APPROVAL',
      };
      mockPrisma.proposedTopicState.findFirst.mockResolvedValue(mockTopic);
      mockPrisma.proposedTopicState.update.mockResolvedValue({
        ...mockTopic,
        status: 'ACCEPTED',
      });

      const result = await service.generateTopicVariants(
        'workspace-123',
        'topic-123',
      );

      expect(mockPrisma.proposedTopicState.findFirst).toHaveBeenCalledWith({
        where: { id: 'topic-123', workspaceId: 'workspace-123' },
      });
      expect(mockPrisma.proposedTopicState.update).toHaveBeenCalledWith({
        where: { id: 'topic-123' },
        data: { status: 'ACCEPTED' },
      });

      expect(result.topicId).toBe('topic-123');
      expect(result.variants).toBeDefined();
      expect(result.variants.twitter).toBe(
        'Mocked Twitter variant: Great topic about NestJS! #nest',
      ); // bold stripped
      expect(result.variants.linkedin).toBe(
        'Mocked LinkedIn variant: **Great** topic about NestJS! #nest',
      ); // bold kept
      expect(result.variants.facebook).toBe(
        'Mocked Facebook variant: Great topic about NestJS! #nest',
      ); // bold stripped
    });

    it('should throw NotFoundException if topic not found', async () => {
      mockPrisma.proposedTopicState.findFirst.mockResolvedValue(null);

      await expect(
        service.generateTopicVariants('workspace-123', 'invalid-topic-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
