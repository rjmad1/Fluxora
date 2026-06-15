import {
  Module,
  Global,
  Provider,
  Inject,
  OnModuleDestroy,
} from '@nestjs/common';
import { Kafka } from 'kafkajs';
import type { Producer } from 'kafkajs';
import { ConfigService, ConfigModule } from '@nestjs/config';

const KafkaProducerProvider: Provider = {
  provide: 'KAFKA_PRODUCER',
  useFactory: async (configService: ConfigService) => {
    const kafka = new Kafka({
      clientId: configService.get<string>('KAFKA_CLIENT_ID', 'fluxora-backend'),
      brokers: configService
        .get<string>('KAFKA_BROKERS', 'localhost:9092')
        .split(','),
    });
    const producer = kafka.producer();
    await producer.connect();
    return producer;
  },
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [KafkaProducerProvider],
  exports: ['KAFKA_PRODUCER'],
})
export class KafkaModule implements OnModuleDestroy {
  constructor(@Inject('KAFKA_PRODUCER') private readonly producer: Producer) {}

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}
