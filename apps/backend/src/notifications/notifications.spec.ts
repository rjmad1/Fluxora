import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { WebhookDispatchProcessor } from './webhook-dispatch.processor';
import { PrismaService } from '../tenant/prisma.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import * as crypto from 'crypto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Notifications & Webhooks Integration', () => {
  let notificationsService: NotificationsService;
  let webhookProcessor: WebhookDispatchProcessor;

  // Mock Queue
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  // Mock Prisma Service
  const mockPrisma = {
    runInWorkspace: jest.fn((cb) => cb(mockPrisma)),
    webhookSubscription: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    webhookDeliveryLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
    workspaceSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  const mockConfig = {
    get: jest.fn((key) => {
      if (key === 'RESEND_API_KEY') return undefined; // Sandbox mode
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        WebhookDispatchProcessor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: getQueueToken('webhook-delivery'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    webhookProcessor = module.get<WebhookDispatchProcessor>(
      WebhookDispatchProcessor,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('NotificationsService.dispatchWebhook', () => {
    it('should queue a delivery job if there are active subscriptions matching event type', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          url: 'https://api.test/hook',
          eventTypes: ['post.published'],
          active: true,
        },
      ]);

      await notificationsService.dispatchWebhook('ws-1', 'post.published', {
        id: 'post-123',
      });

      expect(mockPrisma.webhookSubscription.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: 'ws-1',
          active: true,
          eventTypes: { has: 'post.published' },
        },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'dispatch-webhook',
        {
          subscriptionId: 'sub-1',
          workspaceId: 'ws-1',
          eventType: 'post.published',
          payload: { id: 'post-123' },
        },
        expect.any(Object),
      );
    });

    it('should skip queueing if no active subscriptions exist', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([]);

      await notificationsService.dispatchWebhook('ws-1', 'post.published', {
        id: 'post-123',
      });

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('WebhookDispatchProcessor', () => {
    it('should calculate HMAC-SHA256 signature, dispatch Axios post, and log delivery', async () => {
      const mockSub = {
        id: 'sub-1',
        workspaceId: 'ws-1',
        url: 'https://api.test/hook',
        active: true,
        secret: 'my_super_secret',
      };
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockSub);
      mockedAxios.post.mockResolvedValue({ status: 200, data: { ok: true } });

      const payload = { event: 'test' };
      const job = {
        id: 'job-1',
        data: {
          subscriptionId: 'sub-1',
          workspaceId: 'ws-1',
          eventType: 'post.published',
          payload,
        },
      } as Job;

      const result = await webhookProcessor.process(job);

      // Verify Prisma sub query
      expect(mockPrisma.webhookSubscription.findFirst).toHaveBeenCalledWith({
        where: { id: 'sub-1', workspaceId: 'ws-1' },
      });

      // Verify Axios dispatch signature
      const expectedSignature = crypto
        .createHmac('sha256', 'my_super_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test/hook',
        expect.objectContaining({
          event: 'post.published',
          workspaceId: 'ws-1',
          payload,
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Fluxora-Signature': expectedSignature,
          },
        }),
      );

      // Verify WebhookDeliveryLog persistence
      expect(mockPrisma.webhookDeliveryLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          webhookId: 'sub-1',
          url: 'https://api.test/hook',
          eventType: 'post.published',
          statusCode: 200,
          response: JSON.stringify({ ok: true }),
        }),
      });

      expect(result).toEqual({ success: true, statusCode: 200 });
    });
  });
});
