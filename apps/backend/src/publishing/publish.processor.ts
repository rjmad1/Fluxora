import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PublishActivities } from './publish.activities';

@Processor('publishing-tasks')
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(private readonly publishActivities: PublishActivities) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { postId } = job.data;
    this.logger.log(`Processing publishing job ${job.id} for post ${postId}`);

    try {
      const result =
        await this.publishActivities.publishPostVariantsActivity(postId);
      this.logger.log(
        `Successfully processed job ${job.id} for post ${postId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to process publishing job ${job.id} for post ${postId}: ${err.message}`,
      );
      throw err;
    }
  }
}
