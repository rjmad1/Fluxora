import { Test, TestingModule } from '@nestjs/testing';
import { EventPipelineService } from './event-pipeline.service';
import { ClickHouseService } from './clickhouse.service';
import { KafkaService } from '../observability/kafka.service';
import { IdentityGraphService } from '../identity/identity-graph.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

describe('EventPipelineService', () => {
  let pipelineService: EventPipelineService;
  let clickhouseService: ClickHouseService;
  let clickhouseSandboxFile: string;

  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => {
      if (key === 'CLICKHOUSE_FALLBACK') return 'true';
      if (key === 'KAFKA_FALLBACK') return 'true';
      return defaultVal;
    }),
  };

  const mockIdentityGraphService = {
    resolveProfile: jest.fn().mockImplementation((ws, idents) => {
      return Promise.resolve({
        id: `prof-${idents[0]?.value || 'default'}`,
        workspaceId: ws,
        traits: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }),
    onModuleInit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPipelineService,
        ClickHouseService,
        KafkaService,
        {
          provide: IdentityGraphService,
          useValue: mockIdentityGraphService,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    pipelineService = module.get<EventPipelineService>(EventPipelineService);
    clickhouseService = module.get<ClickHouseService>(ClickHouseService);

    clickhouseSandboxFile = clickhouseService.getSandboxFilePath();

    // Reset ClickHouse sandbox
    if (fs.existsSync(clickhouseSandboxFile)) {
      fs.writeFileSync(clickhouseSandboxFile, '[]', 'utf8');
    }

    await clickhouseService.onModuleInit();
  });

  it('should ingest telemetry events, stitch identity, and propagate to ClickHouse sandbox', async () => {
    const event = await pipelineService.ingestEvent('ws-event-test', {
      postId: 'post-101',
      platform: 'linkedin',
      eventType: 'click',
      identifiers: [{ type: 'COOKIE', value: 'cookie-999' }],
      utmSource: 'newsletter',
    });

    expect(event).toBeDefined();
    expect(event.resolvedProfileId).toBe('prof-cookie-999');
    expect(event.utmSource).toBe('newsletter');

    // Wait for batch processing (simulate telemetry consumer in test by manually inserting)
    await clickhouseService.writeTelemetryEventsBatch([event]);

    const aggregates = await clickhouseService.queryTelemetryPerformance(
      'ws-event-test',
      new Date(Date.now() - 3600000),
      new Date(Date.now() + 3600000),
    );

    expect(aggregates).toHaveLength(1);
    expect(aggregates[0].eventType).toBe('click');
  });

  it('should calculate FIRST and LAST touch attribution correctly', async () => {
    const profileId = 'prof-user-123';

    // Simulate user journey in ClickHouse events log:
    // Touchpoint 1: Twitter click
    // Touchpoint 2: LinkedIn click
    // Conversion: Signup
    const events = [
      {
        id: 'e1',
        workspaceId: 'ws-attr-test',
        postId: 'post-1',
        platform: 'twitter',
        eventType: 'click',
        resolvedProfileId: profileId,
        timestamp: new Date(Date.now() - 10000).toISOString(),
        utmSource: 'twitter',
      },
      {
        id: 'e2',
        workspaceId: 'ws-attr-test',
        postId: 'post-2',
        platform: 'linkedin',
        eventType: 'click',
        resolvedProfileId: profileId,
        timestamp: new Date(Date.now() - 5000).toISOString(),
        utmSource: 'linkedin',
      },
      {
        id: 'e3',
        workspaceId: 'ws-attr-test',
        postId: 'post-2',
        platform: 'linkedin',
        eventType: 'conversion',
        resolvedProfileId: profileId,
        timestamp: new Date().toISOString(),
      },
    ];

    await clickhouseService.writeTelemetryEventsBatch(events);

    const firstTouch = await pipelineService.calculateAttribution(
      'ws-attr-test',
      'FIRST',
    );
    const lastTouch = await pipelineService.calculateAttribution(
      'ws-attr-test',
      'LAST',
    );
    const linearTouch = await pipelineService.calculateAttribution(
      'ws-attr-test',
      'LINEAR',
    );

    // First Touch attribution should yield 100% weight to twitter
    const twFirst = firstTouch.find((t) => t.touchpoint === 'twitter');
    expect(twFirst).toBeDefined();
    expect(twFirst?.weight).toBe(1.0);

    // Last Touch attribution should yield 100% weight to linkedin
    const liLast = lastTouch.find((t) => t.touchpoint === 'linkedin');
    expect(liLast).toBeDefined();
    expect(liLast?.weight).toBe(1.0);

    // Linear Touch attribution should yield 50% split to each
    const twLinear = linearTouch.find((t) => t.touchpoint === 'twitter');
    const liLinear = linearTouch.find((t) => t.touchpoint === 'linkedin');
    expect(twLinear?.weight).toBe(0.5);
    expect(liLinear?.weight).toBe(0.5);
  });
});
