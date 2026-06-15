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

  const testSandboxFile = path.join(
    process.cwd(),
    'logs/clickhouse-sandbox/events.json',
  );

  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => {
      if (key === 'CLICKHOUSE_FALLBACK') return 'true';
      if (key === 'KAFKA_FALLBACK') return 'true';
      return defaultVal;
    }),
  };

  beforeEach(async () => {
    // Reset/clear mock file
    if (fs.existsSync(testSandboxFile)) {
      fs.writeFileSync(testSandboxFile, '[]', 'utf8');
    }

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
});
