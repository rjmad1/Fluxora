import { PostPublishingWorkflow } from './publish.workflow';
import { ApprovalLoopWorkflow } from './approval.workflow';
import { TokenLifecycleWorkflow } from './token-refresh.workflow';
import * as workflow from '@temporalio/workflow';

// Setup maps to track handlers and condition checks
const mockHandlers = new Map<string, (...args: any[]) => any>();
const mockPublishActivity = jest
  .fn()
  .mockResolvedValue({ success: true, publishedCount: 2 });
const mockRefreshActivity = jest.fn().mockResolvedValue(3600);

jest.mock('@temporalio/workflow', () => {
  return {
    defineSignal: jest.fn((name) => ({
      name,
    })),
    setHandler: jest.fn((signal, handler) => {
      mockHandlers.set(signal.name, handler);
    }),
    sleep: jest.fn().mockResolvedValue(undefined),
    proxyActivities: jest.fn(() => ({
      publishPostVariantsActivity: (...args: any[]) =>
        mockPublishActivity(...args),
      refreshAccountTokenActivity: (...args: any[]) =>
        mockRefreshActivity(...args),
    })),
    condition: jest.fn(async (fn: () => boolean) => {
      // Simulate Temporal condition loop by running it until condition is met
      return new Promise<void>((resolve) => {
        const check = () => {
          if (fn()) {
            resolve();
          } else {
            setTimeout(check, 2);
          }
        };
        check();
      });
    }),
  };
});

describe('Temporal Workflows Unit Tests', () => {
  beforeEach(() => {
    mockHandlers.clear();
    jest.clearAllMocks();
  });

  describe('PostPublishingWorkflow', () => {
    it('should sleep if scheduled time is in the future, then publish', async () => {
      const futureTime = new Date(Date.now() + 5000).toISOString();

      const result = await PostPublishingWorkflow('post-1', futureTime);

      expect(result).toEqual({ success: true, publishedCount: 2 });
      expect(workflow.sleep).toHaveBeenCalled();
      // Verify sleep was called with approximately 5000ms (accounting for runtime execution time)
      const sleepCallArg = (workflow.sleep as jest.Mock).mock.calls[0][0];
      expect(sleepCallArg).toBeGreaterThan(4500);
      expect(sleepCallArg).toBeLessThanOrEqual(5000);
    });

    it('should not sleep if scheduled time is in the past', async () => {
      const pastTime = new Date(Date.now() - 5000).toISOString();

      const result = await PostPublishingWorkflow('post-2', pastTime);

      expect(result).toEqual({ success: true, publishedCount: 2 });
      expect(workflow.sleep).not.toHaveBeenCalled();
    });
  });

  describe('TokenLifecycleWorkflow', () => {
    it('should sleep for remaining time minus 15 minutes and trigger refresh activity', async () => {
      // 1 hour (3600s) - 15 mins (900s) = 2700s sleep
      await TokenLifecycleWorkflow('acc-1', 3600);

      expect(workflow.sleep).toHaveBeenCalledWith(2700 * 1000);
      expect(mockRefreshActivity).toHaveBeenCalledWith('acc-1');
    });

    it('should sleep for 5 seconds if token is already expiring in less than 15 minutes', async () => {
      // 10 mins (600s) < 15 mins -> sleepTimeSeconds = 5s sleep
      await TokenLifecycleWorkflow('acc-2', 600);

      expect(workflow.sleep).toHaveBeenCalledWith(5 * 1000);
      expect(mockRefreshActivity).toHaveBeenCalledWith('acc-2');
    });
  });

  describe('ApprovalLoopWorkflow', () => {
    it('should return APPROVED status when approveSignal is triggered', async () => {
      const workflowPromise = ApprovalLoopWorkflow('post-123');

      // Let event loop run to register signal handlers
      await new Promise((resolve) => setTimeout(resolve, 5));

      const approveHandler = mockHandlers.get('approve');
      expect(approveHandler).toBeDefined();

      // Fire approval signal
      approveHandler!();

      const result = await workflowPromise;
      expect(result).toEqual({ status: 'APPROVED' });
    });

    it('should return REJECTED status with feedback when rejectSignal is triggered', async () => {
      const workflowPromise = ApprovalLoopWorkflow('post-123');

      await new Promise((resolve) => setTimeout(resolve, 5));

      const rejectHandler = mockHandlers.get('reject');
      expect(rejectHandler).toBeDefined();

      // Fire reject signal with feedback
      rejectHandler!('Violates brand tone');

      const result = await workflowPromise;
      expect(result).toEqual({
        status: 'REJECTED',
        feedback: 'Violates brand tone',
      });
    });
  });
});
