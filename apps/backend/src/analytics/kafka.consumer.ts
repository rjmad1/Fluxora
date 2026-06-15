import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { ClickHouseService } from './clickhouse.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  async onModuleInit() {
    const brokersStr = this.configService.get<string>(
      'KAFKA_BROKERS',
      'localhost:9092',
    );
    const brokers = brokersStr.split(',');

    this.kafka = new Kafka({
      clientId: 'fluxora-analytics-consumer',
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId: 'fluxora-analytics-group' });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: 'fluxora.publishing.events',
        fromBeginning: true,
      });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;

          try {
            const rawValue = message.value.toString();
            const event = JSON.parse(rawValue);

            this.logger.log(`Received Kafka event: ${event.eventType}`);

            // Ingest to ClickHouse
            await this.clickHouseService.insertEvent({
              eventId:
                event.eventId ||
                `evt-${Math.random().toString(36).substring(2)}`,
              eventType: event.eventType,
              tenantId: event.tenantId || 'Fluxora-Tenant-098',
              workspaceId: event.workspaceId || 'ws-1',
              postId: event.postId,
              variantId: event.variantId,
              platform: event.platform || 'unknown',
              timestamp: event.timestamp || new Date().toISOString(),
            });
          } catch (err) {
            this.logger.error(
              `Failed to process Kafka telemetry message: ${err.message}`,
            );
          }
        },
      });

      this.logger.log('Kafka Consumer successfully initialized and running.');
    } catch (error) {
      this.logger.warn(
        `Kafka Consumer connection failed (running in offline mode): ${error.message}`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.logger.log('Kafka Consumer disconnected.');
      }
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka Consumer: ${err.message}`);
    }
  }
}
