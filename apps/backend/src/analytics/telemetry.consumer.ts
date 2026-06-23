import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { KafkaService } from '../observability/kafka.service';
import { ClickHouseService, TelemetryEventData } from './clickhouse.service';
import { Consumer } from 'kafkajs';

const DEAD_LETTER_MAX = 10_000; // cap to prevent unbounded memory growth
const DEAD_LETTER_RETRY_DELAY_MS = 5_000;

@Injectable()
export class TelemetryConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryConsumer.name);
  private consumer: Consumer | null = null;
  private eventBuffer: TelemetryEventData[] = [];
  private deadLetterBuffer: TelemetryEventData[] = [];
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
      this.logger.log(
        'TelemetryConsumer listening via local in-process Kafka fallback bridge.',
      );
      return;
    }

    try {
      const kafka = this.kafkaService.getKafkaClient();
      if (!kafka) {
        throw new Error('Kafka client is not initialized');
      }

      this.consumer = kafka.consumer({ groupId: 'fluxora-telemetry-group' });
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: 'fluxora.telemetry.events',
        fromBeginning: true,
      });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const key = message.key?.toString() || '';
          const value = message.value?.toString() || '';
          await this.handleIncomingMessage({ key, value });
        },
      });
      this.logger.log(
        'TelemetryConsumer connected and subscribing to Kafka topic: fluxora.telemetry.events',
      );
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
        this.logger.log(
          `Event buffer threshold reached (${this.eventBuffer.length}). Flushing batch.`,
        );
        await this.flush();
      } else if (this.flushTimer === null) {
        // Stagger/Debounce criteria: Flush after 1 second of inactivity
        this.flushTimer = setTimeout(() => {
          this.flush().catch((err) => {
            this.logger.error(
              `Failed to flush telemetry batch: ${err.message}`,
            );
          });
        }, 1000);
      }
    } catch (err) {
      this.logger.error(
        `Failed to handle incoming telemetry message: ${err.message}`,
      );
    }
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Include any previously dead-lettered events in the next flush attempt
    const batch = [...this.deadLetterBuffer, ...this.eventBuffer];
    this.eventBuffer = [];
    this.deadLetterBuffer = [];

    if (batch.length === 0) {
      return;
    }

    this.logger.log(
      `Flushing batch of ${batch.length} events to ClickHouse...`,
    );
    try {
      await this.clickhouseService.writeTelemetryEventsBatch(batch);
    } catch (err) {
      this.logger.error(
        `Failed to flush telemetry batch to ClickHouse: ${err.message}. Queuing ${batch.length} events for retry.`,
      );
      // Dead-letter: schedule a single retry after a delay
      const available = DEAD_LETTER_MAX - this.deadLetterBuffer.length;
      if (available > 0) {
        this.deadLetterBuffer.push(...batch.slice(0, available));
        if (batch.length > available) {
          this.logger.warn(
            `Dead-letter buffer full — ${batch.length - available} telemetry events discarded.`,
          );
        }
        setTimeout(() => {
          this.flush().catch((retryErr) => {
            this.logger.error(
              `Dead-letter retry flush failed: ${retryErr.message}. ` +
                `${this.deadLetterBuffer.length} events remain at risk.`,
            );
          });
        }, DEAD_LETTER_RETRY_DELAY_MS);
      } else {
        this.logger.warn(
          `Dead-letter buffer full — ${batch.length} telemetry events discarded.`,
        );
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up TelemetryConsumer background worker...');

    // Flush any live + dead-lettered events before shutdown
    const totalPending = this.eventBuffer.length + this.deadLetterBuffer.length;
    if (totalPending > 0) {
      this.logger.log(`Flushing final ${totalPending} events during shutdown.`);
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
