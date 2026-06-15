import { defineSignal, setHandler, condition } from '@temporalio/workflow';

// Define the signal interfaces
export const approveSignal = defineSignal<[] | [void]>('approve');
export const rejectSignal = defineSignal<[string]>('reject');

export async function ApprovalLoopWorkflow(
  _postId: string,
): Promise<{ status: 'APPROVED' | 'REJECTED'; feedback?: string }> {
  let isApproved = false;
  let isRejected = false;
  let clientFeedback = '';

  // Register signal handlers
  setHandler(approveSignal, () => {
    isApproved = true;
  });

  setHandler(rejectSignal, (feedback: string) => {
    isRejected = true;
    clientFeedback = feedback;
  });

  // Wait durably until either approve or reject signal is received
  await condition(() => isApproved || isRejected);

  if (isApproved) {
    return {
      status: 'APPROVED',
    };
  } else {
    return {
      status: 'REJECTED',
      feedback: clientFeedback,
    };
  }
}
