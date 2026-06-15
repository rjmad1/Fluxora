import { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { TemporalService } from './temporal.service';

@Global()
@Module({
  providers: [KafkaService, TemporalService],
  exports: [KafkaService, TemporalService],
})
export class ObservabilityModule {}
