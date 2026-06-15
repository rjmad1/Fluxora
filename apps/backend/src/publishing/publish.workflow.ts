import { proxyActivities, sleep } from '@temporalio/workflow';
import type { PublishActivities } from './publish.activities';

const { publishPostVariantsActivity } = proxyActivities<PublishActivities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '10 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export async function PostPublishingWorkflow(
  postId: string,
  scheduledAtIso: string,
): Promise<{ success: boolean; publishedCount: number }> {
  const scheduledTime = new Date(scheduledAtIso).getTime();
  const delayMs = scheduledTime - Date.now();

  if (delayMs > 0) {
    await sleep(delayMs);
  }

  // Execute the activity to publish all variants for the post
  const result = await publishPostVariantsActivity(postId);
  return result;
}
