import { Module, Global, Provider } from '@nestjs/common';
import { Connection, WorkflowClient } from '@temporalio/client';
import { ConfigService, ConfigModule } from '@nestjs/config';

const TemporalClientProvider: Provider = {
  provide: 'TEMPORAL_CLIENT',
  useFactory: async (configService: ConfigService) => {
    const connection = await Connection.connect({
      address: configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233'),
    });
    return new WorkflowClient({
      connection,
      namespace: configService.get<string>('TEMPORAL_NAMESPACE', 'default'),
    });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TemporalClientProvider],
  exports: ['TEMPORAL_CLIENT'],
})
export class TemporalModule {}
