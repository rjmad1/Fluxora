import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import Redis from 'ioredis';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isFallback = false;
  private consumerCallbacks: Map<string, ((message: any) => Promise<void>)[]> =
    new Map();

  private redisPub: Redis | null = null;
  private redisSub: Redis | null = null;

  constructor(private readonly configService: ConfigService) {
    const fallbackEnv = this.configService.get<string>(
      'KAFKA_FALLBACK',
      'false',
    );
    if (fallbackEnv === 'true') {
      this.isFallback = true;
      this.logger.warn(
        'Kafka fallback mode explicitly enabled via environment variable.',
      );
    }
  }

  async onModuleInit() {
    if (this.isFallback) {
      await this.initializeRedisFallback();
      return;
    }

    const brokersString = this.configService.get<string>('KAFKA_BROKERS', '');
    if (!brokersString) {
      this.isFallback = true;
      this.logger.warn(
        'No KAFKA_BROKERS configured. Running in sandbox fallback mode.',
      );
      await this.initializeRedisFallback();
      return;
    }

    const brokers = brokersString.split(',').map((b) => b.trim());
    const clientId = this.configService.get<string>(
      'KAFKA_CLIENT_ID',
      'fluxora-backend',
    );

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
      this.logger.warn(
        `Failed to connect to Kafka. Operating in sandbox fallback mode: ${err.message}`,
      );
      await this.initializeRedisFallback();
    }
  }

  private async initializeRedisFallback() {
    const isTest =
      process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
    if (isTest) {
      this.logger.log(
        'Redis Fallback Bus initialization bypassed in test environment.',
      );
      return;
    }

    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    this.logger.log(
      `Initializing Redis Fallback Bus at ${redisHost}:${redisPort}...`,
    );

    try {
      this.redisPub = new Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: null,
      });
      this.redisSub = new Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: null,
      });

      this.redisPub.on('error', (err) => {
        this.logger.error(`Redis Fallback Publisher error: ${err.message}`);
      });

      this.redisSub.on('error', (err) => {
        this.logger.error(`Redis Fallback Subscriber error: ${err.message}`);
      });

      this.redisSub.on('message', (channel, message) => {
        const prefix = 'fluxora.events.';
        if (channel.startsWith(prefix)) {
          const topic = channel.substring(prefix.length);
          const callbacks = this.consumerCallbacks.get(topic);
          if (callbacks) {
            try {
              const parsed = JSON.parse(message);
              this.logger.log(
                `[Redis Fallback Bus] Message received on channel ${channel}: key=${parsed.key}`,
              );
              for (const cb of callbacks) {
                Promise.resolve()
                  .then(() => cb({ key: parsed.key, value: parsed.value }))
                  .catch((cbErr) => {
                    this.logger.error(
                      `Error in Redis fallback callback for topic ${topic}: ${cbErr.message}`,
                    );
                  });
              }
            } catch (err: any) {
              this.logger.error(
                `Failed to parse Redis fallback message: ${err.message}`,
              );
            }
          }
        }
      });

      // Subscribe to all topics currently registered
      for (const topic of this.consumerCallbacks.keys()) {
        const channel = `fluxora.events.${topic}`;
        await this.redisSub.subscribe(channel);
        this.logger.log(`Redis Fallback subscribed to channel: ${channel}`);
      }

      this.logger.log('Redis Fallback Bus successfully initialized.');
    } catch (err: any) {
      this.logger.error(
        `Failed to initialize Redis Fallback Bus: ${err.message}`,
      );
    }
  }

  async emitEvent(topic: string, key: string, payload: any): Promise<void> {
    const valueString = JSON.stringify(payload);

    if (this.isFallback) {
      this.logger.log(
        `[Kafka Sandbox -> Redis PubSub] Emit to "${topic}" (key: ${key}): ${valueString}`,
      );

      if (this.redisPub) {
        const channel = `fluxora.events.${topic}`;
        try {
          await this.redisPub.publish(
            channel,
            JSON.stringify({ key, value: valueString }),
          );
        } catch (err: any) {
          this.logger.error(`Redis Fallback publish failed: ${err.message}`);
        }
      } else {
        // Double fallback to in-process in case Redis is also unavailable
        const callbacks = this.consumerCallbacks.get(topic);
        if (callbacks) {
          for (const cb of callbacks) {
            Promise.resolve()
              .then(() => cb({ key, value: valueString }))
              .catch((err) => {
                this.logger.error(
                  `Error in double-fallback consumer callback for topic ${topic}: ${err.message}`,
                );
              });
          }
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
      this.logger.error(
        `Failed to publish event to Kafka topic ${topic}: ${err.message}. Swapping to Redis fallback.`,
      );
      this.logger.log(
        `[Kafka Sandbox Fallback] Emit to "${topic}" (key: ${key}): ${valueString}`,
      );
    }
  }

  registerFallbackConsumer(
    topic: string,
    callback: (message: { key: string; value: string }) => Promise<void>,
  ) {
    if (!this.consumerCallbacks.has(topic)) {
      this.consumerCallbacks.set(topic, []);
      if (this.isFallback && this.redisSub) {
        const channel = `fluxora.events.${topic}`;
        this.redisSub.subscribe(channel).catch((err) => {
          this.logger.error(
            `Redis subscribe failed for ${channel}: ${err.message}`,
          );
        });
      }
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

    if (this.redisPub) {
      try {
        await this.redisPub.quit();
        this.logger.log('Redis Fallback Publisher connection closed.');
      } catch (err: any) {
        this.logger.error(`Error closing Redis Publisher: ${err.message}`);
      }
    }

    if (this.redisSub) {
      try {
        await this.redisSub.quit();
        this.logger.log('Redis Fallback Subscriber connection closed.');
      } catch (err: any) {
        this.logger.error(`Error closing Redis Subscriber: ${err.message}`);
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
