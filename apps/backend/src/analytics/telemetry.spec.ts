import { Test, TestingModule } from '@nestjs/testing';
import { ClickHouseService } from './clickhouse.service';
import { KafkaConsumerService } from './kafka.consumer';
import { AnalyticsController } from './analytics.controller';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('Telemetry Ingestion & ClickHouse Analytics', () => {
  let clickHouseService: ClickHouseService;
  let analyticsController: AnalyticsController;
  let tenantService: TenantService;

  // Mock ClickHouse Fetch client
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        ClickHouseService,
        KafkaConsumerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'KAFKA_BROKERS') return 'localhost:9092';
              if (key === 'CLICKHOUSE_HOST') return 'localhost';
              if (key === 'CLICKHOUSE_PORT') return '8123';
              return null;
            }),
          },
        },
        {
          provide: TenantService,
          useValue: {
            getTenantId: jest.fn().mockReturnValue('tenant-123'),
            getWorkspaceId: jest.fn().mockReturnValue('workspace-456'),
          },
        },
      ],
    }).compile();

    clickHouseService = module.get<ClickHouseService>(ClickHouseService);
    analyticsController = module.get<AnalyticsController>(AnalyticsController);
    tenantService = module.get<TenantService>(TenantService);

    // Call NestJS lifecycle hook manually for uncompiled unit testing
    clickHouseService.onModuleInit();
  });

  describe('ClickHouseService', () => {
    it('should format and write telemetry event to ClickHouse REST endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await clickHouseService.insertEvent({
        eventId: 'evt-123',
        eventType: 'post.click',
        tenantId: 'tenant-123',
        workspaceId: 'workspace-456',
        postId: 'post-99',
        variantId: 'variant-99',
        platform: 'linkedin',
        timestamp: '2026-06-15T12:00:00.000Z',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8123',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('INSERT INTO telemetry_events'),
        }),
      );
    });

    it('should query ClickHouse and return array of rows', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: [{ platform: 'linkedin', cnt: 10 }],
            }),
          ),
      });

      const rows = await clickHouseService.executeQuery(
        'SELECT * FROM telemetry_events',
      );

      expect(rows).toEqual([{ platform: 'linkedin', cnt: 10 }]);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8123/?default_format=JSON',
        expect.objectContaining({
          method: 'POST',
          body: 'SELECT * FROM telemetry_events',
        }),
      );
    });
  });

  describe('AnalyticsController', () => {
    it('should return aggregated performance metrics parsed correctly', async () => {
      // Stub clickhouseService.executeQuery
      jest.spyOn(clickHouseService, 'executeQuery').mockResolvedValue([
        { platform: 'linkedin', event_type: 'post.impression', cnt: '100' },
        { platform: 'linkedin', event_type: 'post.click', cnt: '15' },
        { platform: 'twitter', event_type: 'post.dispatched', cnt: '50' },
        { platform: 'twitter', event_type: 'post.click', cnt: '5' },
      ]);

      const result = await analyticsController.getPerformance(
        '2026-06-14T00:00:00Z',
        '2026-06-15T23:59:59Z',
        'linkedin,twitter',
      );

      expect(result).toBeDefined();
      expect(result.views).toBe(150); // 100 linkedin impressions + 50 twitter dispatches
      expect(result.clicks).toBe(20); // 15 + 5 clicks
      expect(result.byPlatform.linkedin).toEqual({
        views: 100,
        clicks: 15,
        shares: 0,
      });
      expect(result.byPlatform.twitter).toEqual({
        views: 50,
        clicks: 5,
        shares: 0,
      });
    });

    it('should throw BadRequestException if workspace context headers are missing', async () => {
      jest.spyOn(tenantService, 'getWorkspaceId').mockReturnValue(undefined);

      await expect(
        analyticsController.getPerformance(
          '2026-06-14T00:00:00Z',
          '2026-06-15T23:59:59Z',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
