import { Test, TestingModule } from '@nestjs/testing';
import { ClickHouseService, TelemetryEventData } from './clickhouse.service';
import { KafkaService } from '../observability/kafka.service';
import { TelemetryConsumer } from './telemetry.consumer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

describe('ClickHouse & Telemetry Integration', () => {
  let clickhouseService: ClickHouseService;
  let kafkaService: KafkaService;
  let telemetryConsumer: TelemetryConsumer;
  let testSandboxFile: string;

  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => {
      if (key === 'CLICKHOUSE_FALLBACK') return 'true';
      if (key === 'KAFKA_FALLBACK') return 'true';
      return defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClickHouseService,
        KafkaService,
        TelemetryConsumer,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    clickhouseService = module.get<ClickHouseService>(ClickHouseService);
    kafkaService = module.get<KafkaService>(KafkaService);
    telemetryConsumer = module.get<TelemetryConsumer>(TelemetryConsumer);

    testSandboxFile = clickhouseService.getSandboxFilePath();

    // Reset/clear mock file
    if (fs.existsSync(testSandboxFile)) {
      fs.writeFileSync(testSandboxFile, '[]', 'utf8');
    }

    await clickhouseService.onModuleInit();
    await kafkaService.onModuleInit();
    await telemetryConsumer.onModuleInit();
  });

  afterEach(async () => {
    await telemetryConsumer.onModuleDestroy();
    await kafkaService.onModuleDestroy();
  });

  it('should write telemetry event batches to sandbox file', async () => {
    const testEvent: TelemetryEventData = {
      id: 'event-1',
      workspaceId: 'ws-test-1',
      postId: 'post-1',
      platform: 'linkedin',
      eventType: 'post.dispatched',
      timestamp: new Date().toISOString(),
    };

    await clickhouseService.writeTelemetryEventsBatch([testEvent]);

    const fileContent = fs.readFileSync(testSandboxFile, 'utf8');
    const data = JSON.parse(fileContent);

    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.some((e: any) => e.id === 'event-1')).toBe(true);
  });

  it('should query aggregated performance metrics correctly', async () => {
    const events: TelemetryEventData[] = [
      {
        id: 'e-1',
        workspaceId: 'ws-test-2',
        postId: 'post-1',
        platform: 'linkedin',
        eventType: 'post.click',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'e-2',
        workspaceId: 'ws-test-2',
        postId: 'post-1',
        platform: 'linkedin',
        eventType: 'post.click',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'e-3',
        workspaceId: 'ws-test-2',
        postId: 'post-1',
        platform: 'twitter',
        eventType: 'post.dispatched',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'e-4',
        workspaceId: 'ws-different',
        postId: 'post-2',
        platform: 'linkedin',
        eventType: 'post.click',
        timestamp: new Date().toISOString(),
      },
    ];

    await clickhouseService.writeTelemetryEventsBatch(events);

    const start = new Date(Date.now() - 3600000); // 1 hour ago
    const end = new Date(Date.now() + 3600000); // 1 hour from now

    const results = await clickhouseService.queryTelemetryPerformance(
      'ws-test-2',
      start,
      end,
    );

    expect(results).toHaveLength(2);

    const linkedinClicks = results.find(
      (r) => r.platform === 'linkedin' && r.eventType === 'post.click',
    );
    const twitterDispatches = results.find(
      (r) => r.platform === 'twitter' && r.eventType === 'post.dispatched',
    );
    const differentWorkspace = results.find(
      (r) => r.workspaceId === 'ws-different',
    );

    expect(linkedinClicks).toBeDefined();
    expect(linkedinClicks?.count).toBe(2);

    expect(twitterDispatches).toBeDefined();
    expect(twitterDispatches?.count).toBe(1);

    expect(differentWorkspace).toBeUndefined();
  });

  it('should pipe emitted Kafka events into ClickHouse batch updates', async () => {
    const testPayload = {
      id: 'event-stream-1',
      workspaceId: 'ws-stream-test',
      postId: 'post-99',
      platform: 'facebook',
      eventType: 'post.click',
      timestamp: new Date().toISOString(),
    };

    // Emit event to KafkaService
    await kafkaService.emitEvent(
      'fluxora.telemetry.events',
      'post-99',
      testPayload,
    );

    // Wait for TelemetryConsumer buffer flush timeout (1 second debounce)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Verify it is written to ClickHouse sandbox file
    const fileContent = fs.readFileSync(testSandboxFile, 'utf8');
    const data = JSON.parse(fileContent);

    expect(data.some((e: any) => e.id === 'event-stream-1')).toBe(true);
  });

  describe('Multi-Touch Attribution Queries', () => {
    it('should calculate first-touch, last-touch, and linear models correctly', async () => {
      const now = new Date();
      const formatTime = (offsetMinutes: number) =>
        new Date(now.getTime() + offsetMinutes * 60000).toISOString();

      const events: TelemetryEventData[] = [
        // Post 1 (Converted)
        {
          id: 'e-attr-1',
          workspaceId: 'ws-attr',
          postId: 'post-attr-1',
          platform: 'linkedin',
          eventType: 'post.impression',
          timestamp: formatTime(-10),
        },
        {
          id: 'e-attr-2',
          workspaceId: 'ws-attr',
          postId: 'post-attr-1',
          platform: 'twitter',
          eventType: 'post.click',
          timestamp: formatTime(-5),
        },
        {
          id: 'e-attr-3',
          workspaceId: 'ws-attr',
          postId: 'post-attr-1',
          platform: 'linkedin',
          eventType: 'post.conversion',
          timestamp: formatTime(0),
        },
        // Post 2 (Converted)
        {
          id: 'e-attr-4',
          workspaceId: 'ws-attr',
          postId: 'post-attr-2',
          platform: 'facebook',
          eventType: 'post.click',
          timestamp: formatTime(-8),
        },
        {
          id: 'e-attr-5',
          workspaceId: 'ws-attr',
          postId: 'post-attr-2',
          platform: 'facebook',
          eventType: 'post.conversion',
          timestamp: formatTime(-2),
        },
        // Post 3 (Not Converted - should not receive attribution credit)
        {
          id: 'e-attr-6',
          workspaceId: 'ws-attr',
          postId: 'post-attr-3',
          platform: 'twitter',
          eventType: 'post.click',
          timestamp: formatTime(-12),
        },
      ];

      await clickhouseService.writeTelemetryEventsBatch(events);

      const start = new Date(now.getTime() - 24 * 3600000);
      const end = new Date(now.getTime() + 24 * 3600000);

      // 1. First-Touch
      const firstTouch = await clickhouseService.queryAttribution(
        'ws-attr',
        'first-touch',
        start,
        end,
      );
      const ftLinkedin = firstTouch.find((r) => r.platform === 'linkedin');
      const ftFacebook = firstTouch.find((r) => r.platform === 'facebook');
      const ftTwitter = firstTouch.find((r) => r.platform === 'twitter');

      expect(ftLinkedin?.credit).toBe(1);
      expect(ftFacebook?.credit).toBe(1);
      expect(ftTwitter?.credit ?? 0).toBe(0);

      // 2. Last-Touch
      const lastTouch = await clickhouseService.queryAttribution(
        'ws-attr',
        'last-touch',
        start,
        end,
      );
      const ltLinkedin = lastTouch.find((r) => r.platform === 'linkedin');
      const ltFacebook = lastTouch.find((r) => r.platform === 'facebook');
      const ltTwitter = lastTouch.find((r) => r.platform === 'twitter');

      expect(ltLinkedin?.credit ?? 0).toBe(0);
      expect(ltFacebook?.credit).toBe(1);
      expect(ltTwitter?.credit).toBe(1);

      // 3. Linear
      const linear = await clickhouseService.queryAttribution(
        'ws-attr',
        'linear',
        start,
        end,
      );
      const linLinkedin = linear.find((r) => r.platform === 'linkedin');
      const linFacebook = linear.find((r) => r.platform === 'facebook');
      const linTwitter = linear.find((r) => r.platform === 'twitter');

      // Post 1 gives 0.5 to linkedin, 0.5 to twitter
      // Post 2 gives 1.0 to facebook
      expect(linLinkedin?.credit).toBe(0.5);
      expect(linFacebook?.credit).toBe(1.0);
      expect(linTwitter?.credit).toBe(0.5);
    });
  });
});
