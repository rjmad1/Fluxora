import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SocialAdaptersService } from './adapters.service';
import { PublishActivities } from './publish.activities';
import { TokenRefreshActivities } from './token-refresh.activities';
import { SecretsModule } from '../secrets/secrets.module';
import { PublishController } from './publish.controller';
import { ApprovalController } from './approval.controller';
import { PublishProcessor } from './publish.processor';
import { Worker, NativeConnection } from '@temporalio/worker';
import { TemporalService } from '../observability/temporal.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SecretsModule,
    BullModule.registerQueue({
      name: 'publishing-tasks',
    }),
  ],
  providers: [
    SocialAdaptersService,
    PublishActivities,
    TokenRefreshActivities,
    PublishProcessor,
  ],
  controllers: [PublishController, ApprovalController],
  exports: [SocialAdaptersService, PublishActivities, TokenRefreshActivities],
})
export class PublishingModule implements OnModuleInit {
  private worker: Worker | null = null;

  constructor(
    private readonly temporalService: TemporalService,
    private readonly publishActivities: PublishActivities,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.temporalService.getIsTemporalActive()) {
      try {
        const address = this.configService.get<string>(
          'TEMPORAL_ADDRESS',
          'localhost:7233',
        );
        console.log(`Starting Temporal Worker pointing to ${address}...`);

        const connection = await NativeConnection.connect({
          address,
        });

        this.worker = await Worker.create({
          workflowsPath: require.resolve('./publish.workflow'),
          activities: {
            publishPostVariantsActivity: (postId: string) =>
              this.publishActivities.publishPostVariantsActivity(postId),
          },
          taskQueue: 'publishing-tasks',
          connection,
        });

        // Run worker in background
        void this.worker.run().catch((err: any) => {
          console.error(`Temporal Worker execution failed: ${err.message}`);
        });
        console.log(
          'Temporal Worker successfully started for task queue: publishing-tasks',
        );
      } catch (err: any) {
        console.error(`Failed to start Temporal Worker: ${err.message}`);
      }
    }
  }
}
