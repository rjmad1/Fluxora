import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { KafkaService } from '../observability/kafka.service';
import { ClickHouseService, TelemetryEventData } from './clickhouse.service';
import { Consumer } from 'kafkajs';

@Injectable()
export class TelemetryConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryConsumer.name);
  private consumer: Consumer | null = null;
  private eventBuffer: TelemetryEventData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly clickhouseService: ClickHouseService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing TelemetryConsumer background worker...');

    if (this.kafkaService.getIsFallback()) {
      // Register local in-process fallback consumer
      this.kafkaService.registerFallbackConsumer(
        'fluxora.telemetry.events',
        async (msg) => {
          await this.handleIncomingMessage(msg);
        },
      );
      this.logger.log('TelemetryConsumer listening via local in-process Kafka fallback bridge.');
      return;
    }

    try {
      const kafka = this.kafkaService.getKafkaClient();
      if (!kafka) {
        throw new Error('Kafka client is not initialized');
      }

      this.consumer = kafka.consumer({ groupId: 'fluxora-telemetry-group' });
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'fluxora.telemetry.events', fromBeginning: true });
      
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const key = message.key?.toString() || '';
          const value = message.value?.toString() || '';
          await this.handleIncomingMessage({ key, value });
        },
      });
      this.logger.log('TelemetryConsumer connected and subscribing to Kafka topic: fluxora.telemetry.events');
    } catch (err) {
      this.logger.warn(
        `Failed to initialize real Kafka consumer: ${err.message}. Defaulting to local fallback consumer bridge.`,
      );
      // Fallback bridge registration in case of runtime connection error
      this.kafkaService.registerFallbackConsumer(
        'fluxora.telemetry.events',
        async (msg) => {
          await this.handleIncomingMessage(msg);
        },
      );
    }
  }

  async handleIncomingMessage(message: { key: string; value: string }) {
    try {
      const event: TelemetryEventData = JSON.parse(message.value);
      this.eventBuffer.push(event);

      // Batching criteria: Flush if buffer reaches 1,000 items
      if (this.eventBuffer.length >= 1000) {
        this.logger.log(`Event buffer threshold reached (${this.eventBuffer.length}). Flushing batch.`);
        await this.flush();
      } else if (this.flushTimer === null) {
        // Stagger/Debounce criteria: Flush after 1 second of inactivity
        this.flushTimer = setTimeout(async () => {
          await this.flush();
        }, 1000);
      }
    } catch (err) {
      this.logger.error(`Failed to handle incoming telemetry message: ${err.message}`);
    }
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const batch = [...this.eventBuffer];
    this.eventBuffer = [];

    if (batch.length === 0) {
      return;
    }

    this.logger.log(`Flushing batch of ${batch.length} events to ClickHouse...`);
    try {
      await this.clickhouseService.writeTelemetryEventsBatch(batch);
    } catch (err) {
      this.logger.error(`Failed to flush telemetry batch to ClickHouse: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up TelemetryConsumer background worker...');
    
    // Flush any leftover events
    if (this.eventBuffer.length > 0) {
      this.logger.log(`Flushing final ${this.eventBuffer.length} events during shutdown.`);
      await this.flush();
    }

    if (this.consumer) {
      try {
        await this.consumer.disconnect();
        this.logger.log('Kafka Consumer disconnected.');
      } catch (err) {
        this.logger.error(`Error disconnecting Kafka Consumer: ${err.message}`);
      }
    }
  }
}
