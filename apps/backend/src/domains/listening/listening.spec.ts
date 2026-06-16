import { Test, TestingModule } from '@nestjs/testing';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';
import { ExtendedFeaturesRepository } from '../../extended-features/extended-features.repository';
import { TenantService } from '../../tenant/tenant.service';

describe('ListeningModule (Decoupled Feature)', () => {
  let controller: ListeningController;
  let service: ListeningService;

  const mockTenantService = {
    getWorkspaceId: jest.fn().mockReturnValue('ws-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListeningController],
      providers: [
        ListeningService,
        ExtendedFeaturesRepository,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<ListeningController>(ListeningController);
    service = module.get<ListeningService>(ListeningService);
  });

  it('should be defined and initialize correctly', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('Brand Mentions', () => {
    it('should query mentions matching tenant workspace context', () => {
      const mentions = controller.getMentions();
      expect(mentions).toBeInstanceOf(Array);
      expect(mentions.length).toBeGreaterThan(0);
      expect(mentions[0].workspaceId).toBe('ws-1');
    });

    it('should convert mention to a ticket in sandbox', () => {
      const mentions = service.getMentions('ws-1');
      const target = mentions.find((m) => !m.ticketCreated);

      if (target) {
        const ticket = controller.convertToTicket({ mentionId: target.id });
        expect(ticket.ticketId).toBeDefined();
        expect(ticket.ticketId).toMatch(/^TKT-\d{5}$/);

        const updated = service
          .getMentions('ws-1')
          .find((m) => m.id === target.id);
        expect(updated?.ticketCreated).toBe(true);
      }
    });
  });

  describe('Competitor setups', () => {
    it('should configure and register new competitor handles', () => {
      const comp = controller.setupCompetitor({
        name: 'Hootsync Plus',
        handle: '@hootsync_plus',
      });

      expect(comp.name).toBe('Hootsync Plus');
      expect(comp.handle).toBe('@hootsync_plus');

      const details = controller.getCompetitorDetails();
      expect(details.posts.length).toBeGreaterThan(0);
    });
  });

  describe('Keyword filtering', () => {
    it('should add new tracking keywords to workspace settings', () => {
      const keywords = controller.addKeyword({ keyword: 'AI-scaling' });
      expect(keywords).toContain('AI-scaling');

      const final = controller.removeKeyword('AI-scaling');
      expect(final).not.toContain('AI-scaling');
    });
  });

  describe('Trends and Virality', () => {
    it('should forecast trends and predict virality', () => {
      const trends = controller.getTrendingTopics();
      expect(trends).toBeInstanceOf(Array);

      const prediction = controller.predictVirality({
        content: 'Short post! 🚀',
      });
      expect(prediction.score).toBeGreaterThanOrEqual(10);
      expect(prediction.shifts.length).toBeGreaterThan(0);
    });
  });
});
