import { proxyActivities, sleep } from '@temporalio/workflow';
import type { TokenRefreshActivities } from './token-refresh.activities';

const { refreshAccountTokenActivity } = proxyActivities<TokenRefreshActivities>(
  {
    startToCloseTimeout: '1 minute',
    retry: {
      initialInterval: '5 seconds',
      backoffCoefficient: 2,
      maximumAttempts: 5,
    },
  },
);

export async function TokenLifecycleWorkflow(
  accountId: string,
  initialExpiresInSeconds: number,
): Promise<void> {
  // Sleep until 15 minutes (900 seconds) before the token expires
  // If the token is already expiring in less than 15 minutes, refresh it in 5 seconds.
  let sleepTimeSeconds = initialExpiresInSeconds - 900;
  if (sleepTimeSeconds <= 0) {
    sleepTimeSeconds = 5;
  }

  await sleep(sleepTimeSeconds * 1000);

  // Execute the activity to refresh the token and save it to Vault & DB
  await refreshAccountTokenActivity(accountId);
}
