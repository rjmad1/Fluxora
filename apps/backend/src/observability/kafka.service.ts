import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isFallback = false;
  private consumerCallbacks: Map<string, ((message: any) => Promise<void>)[]> = new Map();

  constructor(private readonly configService: ConfigService) {
    const fallbackEnv = this.configService.get<string>('KAFKA_FALLBACK', 'false');
    if (fallbackEnv === 'true') {
      this.isFallback = true;
      this.logger.warn('Kafka fallback mode explicitly enabled via environment variable.');
    }
  }

  async onModuleInit() {
    if (this.isFallback) {
      return;
    }

    const brokersString = this.configService.get<string>('KAFKA_BROKERS', '');
    if (!brokersString) {
      this.isFallback = true;
      this.logger.warn('No KAFKA_BROKERS configured. Running in sandbox fallback mode.');
      return;
    }

    const brokers = brokersString.split(',').map((b) => b.trim());
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID', 'fluxora-backend');

    try {
      this.logger.log(`Connecting to Kafka brokers: ${brokers.join(', ')}`);
      this.kafka = new Kafka({
        clientId,
        brokers,
        connectionTimeout: 3000,
        requestTimeout: 4000,
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.logger.log('Successfully connected Kafka Producer.');
    } catch (err) {
      this.isFallback = true;
      this.logger.warn(`Failed to connect to Kafka. Operating in sandbox fallback mode: ${err.message}`);
    }
  }

  async emitEvent(topic: string, key: string, payload: any): Promise<void> {
    const valueString = JSON.stringify(payload);
    
    if (this.isFallback) {
      this.logger.log(`[Kafka Sandbox] Emit to "${topic}" (key: ${key}): ${valueString}`);
      
      // In fallback mode, bridge to registered listeners in-process
      const callbacks = this.consumerCallbacks.get(topic);
      if (callbacks) {
        for (const cb of callbacks) {
          Promise.resolve().then(() => cb({ key, value: valueString })).catch(err => {
            this.logger.error(`Error in fallback consumer callback for topic ${topic}: ${err.message}`);
          });
        }
      }
      return;
    }

    try {
      if (!this.producer) {
        throw new Error('Producer not initialized');
      }
      await this.producer.send({
        topic,
        messages: [{ key, value: valueString }],
      });
    } catch (err) {
      this.logger.error(`Failed to publish event to Kafka topic ${topic}: ${err.message}`);
      this.logger.log(`[Kafka Sandbox Fallback] Emit to "${topic}" (key: ${key}): ${valueString}`);
    }
  }

  registerFallbackConsumer(topic: string, callback: (message: { key: string; value: string }) => Promise<void>) {
    if (!this.consumerCallbacks.has(topic)) {
      this.consumerCallbacks.set(topic, []);
    }
    this.consumerCallbacks.get(topic)!.push(callback);
    this.logger.log(`Registered local fallback consumer for topic: ${topic}`);
  }

  async onModuleDestroy() {
    if (this.producer) {
      try {
        await this.producer.disconnect();
        this.logger.log('Kafka Producer disconnected.');
      } catch (err) {
        this.logger.error(`Error disconnecting Kafka Producer: ${err.message}`);
      }
    }
  }

  getIsFallback(): boolean {
    return this.isFallback;
  }
  
  getKafkaClient(): Kafka | null {
    return this.kafka;
  }
}
