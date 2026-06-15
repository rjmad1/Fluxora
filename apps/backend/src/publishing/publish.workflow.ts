import { proxyActivities, sleep } from '@temporalio/workflow';

// Define the activities interface to proxy
export interface PublishingActivities {
  publishPostVariantsActivity(postId: string): Promise<{ success: boolean; publishedCount: number }>;
}

const { publishPostVariantsActivity } = proxyActivities<PublishingActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
    maximumAttempts: 5,
  },
});

/**
 * Stateful workflow that sleeps until the designated launch epoch
 * and then executes the platform distribution.
 */
export async function postPublishingWorkflow(
  postId: string,
  scheduledAtStr: string,
): Promise<void> {
  const scheduledTime = new Date(scheduledAtStr).getTime();
  const delayMs = Math.max(0, scheduledTime - Date.now());

  if (delayMs > 0) {
    await sleep(delayMs);
  }

  await publishPostVariantsActivity(postId);
}
