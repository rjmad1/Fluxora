import { Test, TestingModule } from '@nestjs/testing';
import { ExtendedFeaturesController } from './extended-features.controller';
import { ExtendedFeaturesService } from './extended-features.service';
import { TenantService } from '../tenant/tenant.service';

describe('ExtendedFeatures', () => {
  let controller: ExtendedFeaturesController;
  let service: ExtendedFeaturesService;

  const mockTenantService = {
    getWorkspaceId: jest.fn().mockReturnValue('ws-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtendedFeaturesController],
      providers: [
        ExtendedFeaturesService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<ExtendedFeaturesController>(
      ExtendedFeaturesController,
    );
    service = module.get<ExtendedFeaturesService>(ExtendedFeaturesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('Compliance Keyword Flagging', () => {
    it('should pass compliance on safe text', () => {
      const result = service.checkComplianceContent(
        'Building a telemetry stream using Kafka and ClickHouse for our social dashboards.',
      );
      expect(result.compliant).toBe(true);
      expect(result.flaggedKeywords).toHaveLength(0);
    });

    it('should flag prohibited phrases', () => {
      const result = service.checkComplianceContent(
        'Try this risk-free investment for guaranteed returns!',
      );
      expect(result.compliant).toBe(false);
      expect(result.flaggedKeywords).toContain('guaranteed returns');
    });
  });

  describe('Brand Mentions & Tickets', () => {
    it('should list mentions for active workspace', () => {
      const mentions = controller.getMentions();
      expect(mentions).toBeInstanceOf(Array);
      expect(mentions.length).toBeGreaterThan(0);
    });

    it('should convert mention to support ticket', () => {
      const mentions = service.getMentions('ws-1');
      const unticketed = mentions.find((m) => !m.ticketCreated);

      if (unticketed) {
        const ticket = controller.convertToTicket({ mentionId: unticketed.id });
        expect(ticket.ticketId).toBeDefined();
        expect(ticket.ticketId).toMatch(/^TKT-\d{5}$/);

        const updated = service
          .getMentions('ws-1')
          .find((m) => m.id === unticketed.id);
        expect(updated?.ticketCreated).toBe(true);
        expect(updated?.ticketId).toBe(ticket.ticketId);
      }
    });
  });

  describe('Security Configuration', () => {
    it('should toggle 2FA settings', () => {
      const settings = controller.saveSecurity({
        twoFactorEnabled: true,
        retentionDays: 180,
      });

      expect(settings.twoFactorEnabled).toBe(true);
      expect(settings.retentionDays).toBe(180);

      const activeSettings = service.getOrCreateSettings('ws-1');
      expect(activeSettings.twoFactorEnabled).toBe(true);
    });
  });

  describe('New Advanced Social Features', () => {
    it('should forecast trends and predict virality', () => {
      const trends = controller.getTrendingTopics();
      expect(trends).toBeInstanceOf(Array);

      const prediction = controller.predictVirality({
        content: 'Short post! 🚀',
      });
      expect(prediction.score).toBeGreaterThanOrEqual(10);
      expect(prediction.shifts.length).toBeGreaterThan(0);
    });

    it('should setup and track competitor intel', () => {
      const detailsBefore = controller.getCompetitorDetails();
      const initialCount = detailsBefore.posts.length;

      const newComp = controller.setupCompetitor({
        name: 'BufferStream V2',
        handle: '@bufferstream2',
      });
      expect(newComp.name).toBe('BufferStream V2');
      expect(newComp.handle).toBe('@bufferstream2');

      const detailsAfter = controller.getCompetitorDetails();
      expect(detailsAfter.posts.length).toBeGreaterThan(initialCount);
    });

    it('should manage community CRM replies & assignment', () => {
      const inbox = controller.getInboxMessages();
      expect(inbox).toBeInstanceOf(Array);
      expect(inbox.length).toBeGreaterThan(0);

      const firstMessage = inbox[0];
      const initialRepliesCount = firstMessage.replies.length;

      const updatedReply = controller.replyToInboxMessage({
        messageId: firstMessage.id,
        replyText: 'Thanks for reaching out!',
      });
      expect(updatedReply.replies.length).toBe(initialRepliesCount + 1);
      expect(updatedReply.replies[initialRepliesCount].body).toBe(
        'Thanks for reaching out!',
      );

      const updatedAssign = controller.assignInboxMessage({
        messageId: firstMessage.id,
        assignedTo: 'Dave K.',
      });
      expect(updatedAssign.assignedTo).toBe('Dave K.');
    });

    it('should register custom taxonomy and save target dials', () => {
      const initTaxonomy = controller.getTaxonomyTags();
      const initialTagsCount = initTaxonomy.tags.length;

      const newTag = controller.createTaxonomyTag({
        name: 'kubernetes',
        color: '#326CE5',
        description: 'Cluster setups',
      });
      expect(newTag.name).toBe('kubernetes');

      const finalTaxonomy = controller.getTaxonomyTags();
      expect(finalTaxonomy.tags.length).toBe(initialTagsCount + 1);

      const weights = controller.saveTopicWeights({
        weights: [
          { category: 'Technical Architectures', weight: 50 },
          { category: 'Product Releases', weight: 50 },
        ],
      });
      expect(
        weights.find((w) => w.category === 'Technical Architectures')?.weight,
      ).toBe(50);
    });

    it('should configure media transformations', () => {
      const transformed = controller.transformMediaItem({
        assetId: 'm-1',
        focalPoint: { x: 30, y: 70 },
        textOverlay: 'Latency: <500ms',
        watermarkPreset: 'white-bottom-right-60%',
      });

      expect(transformed.focalPoint).toEqual({ x: 30, y: 70 });
      expect(transformed.textOverlay).toBe('Latency: <500ms');
      expect(transformed.watermarkPreset).toBe('white-bottom-right-60%');
    });
  });
});
