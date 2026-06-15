import { Test, TestingModule } from '@nestjs/testing';
import { ClickHouseService } from './clickhouse.service';
import { KafkaConsumerService } from './kafka.consumer';
import { AnalyticsController } from './analytics.controller';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

// Mock kafkajs module
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockSubscribe = jest.fn().mockResolvedValue(undefined);
const mockRun = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      consumer: jest.fn().mockImplementation(() => ({
        connect: mockConnect,
        subscribe: mockSubscribe,
        run: mockRun,
        disconnect: mockDisconnect,
      })),
    })),
  };
});

describe('Telemetry Ingestion & ClickHouse Analytics', () => {
  let clickHouseService: ClickHouseService;
  let kafkaConsumerService: KafkaConsumerService;
  let analyticsController: AnalyticsController;
  let tenantService: TenantService;

  // Mock ClickHouse Fetch client
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(async () => {
    mockFetch.mockReset();
    mockConnect.mockClear();
    mockSubscribe.mockClear();
    mockRun.mockClear();
    mockDisconnect.mockClear();

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
    kafkaConsumerService =
      module.get<KafkaConsumerService>(KafkaConsumerService);
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
        expect.stringContaining(
          'INSERT%20INTO%20telemetry_events%20FORMAT%20JSONEachRow',
        ),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"event_id":"evt-123"'),
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
      expect(result.views).toBe(150);
      expect(result.clicks).toBe(20);
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

  describe('KafkaConsumerService', () => {
    it('should successfully connect, subscribe to publishing events topic, and register eachMessage run handler', async () => {
      await kafkaConsumerService.onModuleInit();

      expect(mockConnect).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalledWith({
        topic: 'fluxora.publishing.events',
        fromBeginning: true,
      });
      expect(mockRun).toHaveBeenCalledWith(
        expect.objectContaining({
          eachMessage: expect.any(Function),
        }),
      );
    });

    it('should handle incoming Kafka event messages and insert them into ClickHouse', async () => {
      await kafkaConsumerService.onModuleInit();

      // Retrieve eachMessage callback passed to consumer.run
      const runConfig = mockRun.mock.calls[0][0];
      const eachMessageCallback = runConfig.eachMessage;

      const mockPayload = {
        message: {
          value: Buffer.from(
            JSON.stringify({
              eventId: 'evt-test-1',
              eventType: 'post.click',
              tenantId: 'tenant-abc',
              workspaceId: 'workspace-xyz',
              postId: 'post-1',
              variantId: 'var-1',
              platform: 'twitter',
              timestamp: '2026-06-15T09:00:00.000Z',
            }),
          ),
        },
      };

      const insertSpy = jest
        .spyOn(clickHouseService, 'insertEvent')
        .mockResolvedValue(undefined);

      await eachMessageCallback(mockPayload);

      expect(insertSpy).toHaveBeenCalledWith({
        eventId: 'evt-test-1',
        eventType: 'post.click',
        tenantId: 'tenant-abc',
        workspaceId: 'workspace-xyz',
        postId: 'post-1',
        variantId: 'var-1',
        platform: 'twitter',
        timestamp: '2026-06-15T09:00:00.000Z',
      });
    });

    it('should bypass empty messages', async () => {
      await kafkaConsumerService.onModuleInit();
      const runConfig = mockRun.mock.calls[0][0];
      const eachMessageCallback = runConfig.eachMessage;

      const mockPayload = {
        message: {
          value: null,
        },
      };

      const insertSpy = jest.spyOn(clickHouseService, 'insertEvent');

      await eachMessageCallback(mockPayload);

      expect(insertSpy).not.toHaveBeenCalled();
    });

    it('should fallback with default fields if fields are missing in Kafka event payload', async () => {
      await kafkaConsumerService.onModuleInit();
      const runConfig = mockRun.mock.calls[0][0];
      const eachMessageCallback = runConfig.eachMessage;

      const mockPayload = {
        message: {
          value: Buffer.from(
            JSON.stringify({
              eventType: 'post.impression',
              postId: 'post-2',
            }),
          ),
        },
      };

      const insertSpy = jest
        .spyOn(clickHouseService, 'insertEvent')
        .mockResolvedValue(undefined);

      await eachMessageCallback(mockPayload);

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: expect.stringMatching(/^evt-/),
          eventType: 'post.impression',
          tenantId: 'Fluxora-Tenant-098',
          workspaceId: 'ws-1',
          postId: 'post-2',
          platform: 'unknown',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should catch parsing or ingestion errors without throwing', async () => {
      await kafkaConsumerService.onModuleInit();
      const runConfig = mockRun.mock.calls[0][0];
      const eachMessageCallback = runConfig.eachMessage;

      const mockPayload = {
        message: {
          value: Buffer.from('invalid-json-string'),
        },
      };

      // Ingestion callback should resolve successfully (logs the error instead of throwing)
      await expect(eachMessageCallback(mockPayload)).resolves.not.toThrow();
    });

    it('should log warning if connection fails', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Broker connection refused'));

      // Should handle error gracefully
      await expect(kafkaConsumerService.onModuleInit()).resolves.not.toThrow();
    });

    it('should disconnect consumer on destroy', async () => {
      await kafkaConsumerService.onModuleInit();
      await kafkaConsumerService.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should catch disconnect errors gracefully on destroy', async () => {
      await kafkaConsumerService.onModuleInit();
      mockDisconnect.mockRejectedValueOnce(new Error('Disconnect failed'));

      await expect(
        kafkaConsumerService.onModuleDestroy(),
      ).resolves.not.toThrow();
    });
  });
});
