import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../observability/kafka.service';
import { ClickHouseService, TelemetryEventData } from './clickhouse.service';
import { IdentityGraphService } from '../identity/identity-graph.service';

export interface EnrichedTelemetryEvent extends TelemetryEventData {
  resolvedProfileId: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

@Injectable()
export class EventPipelineService {
  private readonly logger = new Logger(EventPipelineService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly clickhouseService: ClickHouseService,
    private readonly identityService: IdentityGraphService,
  ) {}

  // Ingest raw telemetry events, stitch profiles, and emit enriched event to Kafka
  async ingestEvent(
    workspaceId: string,
    payload: {
      postId: string;
      platform: string;
      eventType: string;
      identifiers: Array<{ type: 'EMAIL' | 'COOKIE' | 'TWITTER_HANDLE' | 'CRM_ID' | 'PHONE'; value: string }>;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    },
  ): Promise<EnrichedTelemetryEvent> {
    this.logger.log(`Ingesting telemetry event: ${payload.eventType} for workspace ${workspaceId}`);

    // 1. Resolve Identity
    const resolvedProfile = await this.identityService.resolveProfile(
      workspaceId,
      payload.identifiers,
    );

    // 2. Create Enriched Telemetry Event
    const event: EnrichedTelemetryEvent = {
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      postId: payload.postId,
      platform: payload.platform,
      eventType: payload.eventType,
      resolvedProfileId: resolvedProfile.id,
      timestamp: new Date().toISOString(),
      referrer: payload.referrer,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
    };

    // 3. Emit Enriched Event to Kafka
    await this.kafkaService.emitEvent('fluxora.telemetry.events', event.id, event);

    return event;
  }

  // Calculate Multi-Touch Attribution weights dynamically
  async calculateAttribution(
    workspaceId: string,
    attributionType: 'FIRST' | 'LAST' | 'LINEAR' | 'TIME_DECAY',
  ): Promise<Array<{ touchpoint: string; weight: number; conversionCount: number }>> {
    // Fetch telemetry events from ClickHouse / sandbox
    // For local evaluation, we can read sandbox file directly if ClickHouse is in fallback mode
    const isFallback = this.clickhouseService.getIsFallback();
    let events: any[] = [];

    if (isFallback) {
      const sandboxPath = path.join(process.cwd(), 'logs/clickhouse-sandbox/events.json');
      if (fs.existsSync(sandboxPath)) {
        events = JSON.parse(fs.readFileSync(sandboxPath, 'utf8') || '[]');
      }
    } else {
      // In real mode, run query against ClickHouse
      // Here we simulate fetching the click and conversion history
      events = await this.clickhouseService.queryTelemetryPerformance(
        workspaceId,
        new Date(Date.now() - 30 * 86400000), // 30 days ago
        new Date(),
      );
    }

    // Filter by workspace
    const workspaceEvents = events.filter((e) => e.workspaceId === workspaceId);

    // Group events by resolved profile to build the customer journey paths
    const journeys: Record<string, typeof workspaceEvents> = {};
    for (const event of workspaceEvents) {
      if (!event.resolvedProfileId) continue;
      if (!journeys[event.resolvedProfileId]) {
        journeys[event.resolvedProfileId] = [];
      }
      journeys[event.resolvedProfileId].push(event);
    }

    // Process journeys to calculate channel attribution weights
    const attributionWeights: Record<string, { weight: number; count: number }> = {};

    for (const [profileId, pathEvents] of Object.entries(journeys)) {
      // Sort events by timestamp
      pathEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Identify touchpoints (e.g. clicks/visits with UTM campaign or source)
      const touchpoints = pathEvents.filter(
        (e) =>
          (e.eventType === 'click' || e.utmSource) &&
          e.eventType !== 'conversion' &&
          e.eventType !== 'signup',
      );
      // Check if there is a conversion event in the journey
      const hasConverted = pathEvents.some(
        (e) => e.eventType === 'conversion' || e.eventType === 'signup',
      );

      if (touchpoints.length === 0 || !hasConverted) continue;

      if (attributionType === 'FIRST') {
        const first = touchpoints[0];
        const key = first.utmSource || first.platform || 'direct';
        if (!attributionWeights[key]) attributionWeights[key] = { weight: 0, count: 0 };
        attributionWeights[key].weight += 1.0;
        attributionWeights[key].count += 1;
      } else if (attributionType === 'LAST') {
        const last = touchpoints[touchpoints.length - 1];
        const key = last.utmSource || last.platform || 'direct';
        if (!attributionWeights[key]) attributionWeights[key] = { weight: 0, count: 0 };
        attributionWeights[key].weight += 1.0;
        attributionWeights[key].count += 1;
      } else if (attributionType === 'LINEAR') {
        const splitWeight = 1.0 / touchpoints.length;
        for (const touch of touchpoints) {
          const key = touch.utmSource || touch.platform || 'direct';
          if (!attributionWeights[key]) attributionWeights[key] = { weight: 0, count: 0 };
          attributionWeights[key].weight += splitWeight;
          attributionWeights[key].count += 1;
        }
      } else if (attributionType === 'TIME_DECAY') {
        // More weight to touchpoints closer to the conversion event
        const conversionEvent = pathEvents.find((e) => e.eventType === 'conversion' || e.eventType === 'signup')!;
        const conversionTime = new Date(conversionEvent.timestamp).getTime();

        let totalScore = 0;
        const weights = touchpoints.map((t) => {
          const touchTime = new Date(t.timestamp).getTime();
          const daysDiff = (conversionTime - touchTime) / (1000 * 60 * 60 * 24);
          const score = Math.pow(0.5, daysDiff / 7); // 7-day half life decay
          totalScore += score;
          return { key: t.utmSource || t.platform || 'direct', score };
        });

        for (const item of weights) {
          const key = item.key;
          const normalizedWeight = item.score / (totalScore || 1);
          if (!attributionWeights[key]) attributionWeights[key] = { weight: 0, count: 0 };
          attributionWeights[key].weight += normalizedWeight;
          attributionWeights[key].count += 1;
        }
      }
    }

    // Format output
    return Object.entries(attributionWeights).map(([touchpoint, val]) => ({
      touchpoint,
      weight: parseFloat(val.weight.toFixed(2)),
      conversionCount: val.count,
    }));
  }
}

// Simple path helper inclusion
import * as path from 'path';
import * as fs from 'fs';
