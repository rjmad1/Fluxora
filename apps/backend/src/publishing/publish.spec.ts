import { Test, TestingModule } from '@nestjs/testing';
import { SocialAdaptersService } from './adapters.service';
import { PublishActivities } from './publish.activities';
import { PrismaService } from '../tenant/prisma.service';
import { VaultService } from '../secrets/vault.service';
import { PublishController } from './publish.controller';
import { ApprovalController } from './approval.controller';
import { TenantService } from '../tenant/tenant.service';
import { HttpException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { KafkaService } from '../observability/kafka.service';
import { TemporalService } from '../observability/temporal.service';

describe('Social Media Publishing & Queue Activities', () => {
  let adaptersService: SocialAdaptersService;
  let publishActivities: PublishActivities;
  let vaultService: VaultService;
  let prismaService: PrismaService;
  let publishController: PublishController;
  let approvalController: ApprovalController;
  let tenantService: TenantService;
  let notificationsService: NotificationsService;
  let kafkaService: KafkaService;

  // Mock BullMQ Queue
  const mockBullQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublishController, ApprovalController],
      providers: [
        SocialAdaptersService,
        PublishActivities,
        {
          provide: TemporalService,
          useValue: {
            getIsTemporalActive: jest.fn().mockReturnValue(false),
            getClient: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emitEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key, defaultVal) => {
              if (key === 'PORTAL_SECRET_KEY')
                return 'fluxora-client-portal-secret-key-change-me-in-production';
              return defaultVal;
            }),
          },
        },
        {
          provide: getQueueToken('publishing-tasks'),
          useValue: mockBullQueue,
        },
        {
          provide: TenantService,
          useValue: {
            getWorkspaceId: jest.fn().mockReturnValue('ws-1'),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue('mock-mail-file.html'),
            dispatchWebhook: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: VaultService,
          useValue: {
            getAccountTokens: jest.fn().mockResolvedValue({
              accessToken: 'mock-access-token-123',
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            post: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'post-1',
                status: 'PendingApproval',
                workspaceId: 'ws-1',
                content: 'Check out Fluxora!',
                createdByEmail: 'creator@example.com',
                workspace: {
                  id: 'ws-1',
                  name: 'Awesome Agency',
                  tenantId: 'tenant-123',
                  notificationSettings: {
                    clientEmail: 'client@example.com',
                  },
                },
                variants: [
                  {
                    id: 'v-1',
                    platform: 'linkedin',
                    overrideContent: 'Enterprise features on LinkedIn!',
                    assetUrls: [],
                  },
                  {
                    id: 'v-2',
                    platform: 'twitter',
                    overrideContent: 'Quick status update #x',
                    assetUrls: [],
                  },
                ],
              }),
              update: jest.fn().mockImplementation(({ where, data }) =>
                Promise.resolve({
                  id: where.id,
                  status: data.status,
                  feedback: data.feedback,
                  workspaceId: 'ws-1',
                  createdByEmail: 'creator@example.com',
                  workspace: {
                    id: 'ws-1',
                    name: 'Awesome Agency',
                    tenantId: 'tenant-123',
                    notificationSettings: {
                      clientEmail: 'client@example.com',
                    },
                  },
                  scheduledAt: new Date('2026-06-15T00:00:00Z'),
                }),
              ),
              create: jest.fn().mockImplementation(({ data }) =>
                Promise.resolve({
                  id: 'post-new-123',
                  workspaceId: data.workspaceId,
                  content: data.content,
                  scheduledAt: data.scheduledAt,
                  status: data.status,
                  createdAt: new Date(),
                }),
              ),
            },
            telemetryEvent: {
              create: jest.fn().mockResolvedValue({ id: 'telemetry-1' }),
            },
            runInWorkspace: jest.fn((cb) =>
              cb({
                post: {
                  create: jest.fn().mockImplementation(({ data }) =>
                    Promise.resolve({
                      id: 'post-new-123',
                      workspaceId: 'ws-1',
                      content: data.content,
                      scheduledAt: data.scheduledAt,
                      status: data.status,
                      createdAt: new Date('2026-06-15T00:00:00Z'),
                    }),
                  ),
                },
              }),
            ),
            connectedAccount: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'acc-li', provider: 'linkedin', status: 'ACTIVE' },
                { id: 'acc-tw', provider: 'twitter', status: 'ACTIVE' },
              ]),
            },
            workspaceSettings: {
              findUnique: jest.fn().mockResolvedValue({
                workspaceId: 'ws-1',
                proxyUrl: 'http://proxy.example.com:8080',
              }),
            },
          },
        },
      ],
    }).compile();

    adaptersService = module.get<SocialAdaptersService>(SocialAdaptersService);
    publishActivities = module.get<PublishActivities>(PublishActivities);
    vaultService = module.get<VaultService>(VaultService);
    prismaService = module.get<PrismaService>(PrismaService);
    publishController = module.get<PublishController>(PublishController);
    approvalController = module.get<ApprovalController>(ApprovalController);
    tenantService = module.get<TenantService>(TenantService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SocialAdaptersService', () => {
    it('should successfully publish to LinkedIn and return share URL', async () => {
      const res = await adaptersService.publishToPlatform(
        'linkedin',
        'Hello LinkedIn',
        [],
        'token-123',
      );
      expect(res.success).toBe(true);
      expect(res.postUrl).toContain('linkedin.com');
      expect(res.externalPostId).toBeDefined();
    });

    it('should throw HttpException for rate limits when content triggers it', async () => {
      await expect(
        adaptersService.publishToPlatform(
          'twitter',
          'This will trigger-rate-limit here',
          [],
          'token-123',
        ),
      ).rejects.toThrow(HttpException);
    });

    it('should throw generic error for network timeout triggers', async () => {
      await expect(
        adaptersService.publishToPlatform(
          'facebook',
          'Oops trigger-network-error',
          [],
          'token-123',
        ),
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('PublishActivities', () => {
    it('should fetch post, fetch credentials, execute publish, and write telemetry', async () => {
      const result =
        await publishActivities.publishPostVariantsActivity('post-1');

      expect(result.success).toBe(true);
      expect(result.publishedCount).toBe(2);
      expect(vaultService.getAccountTokens).toHaveBeenCalledTimes(2);
      expect(kafkaService.emitEvent).toHaveBeenCalled();
      expect(prismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'Published' },
      });
    });

    it('should fail and mark status as Failed if any variant publication fails', async () => {
      // Stub findUnique to return a post with a rate limit trigger
      jest.spyOn(prismaService.post, 'findUnique').mockResolvedValue({
        id: 'post-1',
        workspaceId: 'ws-1',
        content: 'Check out Fluxora!',
        workspace: {
          id: 'ws-1',
          tenantId: 'tenant-123',
        },
        variants: [
          {
            id: 'v-1',
            platform: 'linkedin',
            overrideContent: 'trigger-rate-limit text',
            assetUrls: [],
          },
        ],
      } as any);

      await expect(
        publishActivities.publishPostVariantsActivity('post-1'),
      ).rejects.toThrow();

      expect(prismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'Failed' },
      });
    });
  });

  describe('PublishController', () => {
    it('should create post and queue BullMQ job', async () => {
      const result = await publishController.schedulePost({
        content: 'Check out our latest release!',
        scheduledAt: '2026-06-19T09:00:00Z',
        variants: [
          {
            platform: 'linkedin',
            overrideContent:
              'Check out our latest enterprise release on LinkedIn!',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('post-new-123');
      expect(result.status).toBe('Scheduled');
      expect(mockBullQueue.add).toHaveBeenCalled();
      expect(prismaService.runInWorkspace).toHaveBeenCalled();
    });

    it('should throw BadRequestException if workspace context is missing', async () => {
      jest.spyOn(tenantService, 'getWorkspaceId').mockReturnValue(undefined);

      await expect(
        publishController.schedulePost({
          content: 'Check out our latest release!',
          scheduledAt: '2026-06-19T09:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if scheduled date is invalid', async () => {
      await expect(
        publishController.schedulePost({
          content: 'Check out our latest release!',
          scheduledAt: 'invalid-date',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ApprovalController', () => {
    it('should process client approval via signed token, update status, and schedule job', async () => {
      const { token } = await approvalController.getApprovalToken('post-1');
      const result = await approvalController.submitApproval(token, {
        action: 'approve',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('Scheduled');
      expect(result.actionExecuted).toBe('approve');
      expect(prismaService.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post-1' },
          data: expect.objectContaining({ status: 'Scheduled' }),
        }),
      );
      expect(mockBullQueue.add).toHaveBeenCalled();
    });

    it('should process client rejection via signed token, update status, and log feedback', async () => {
      const { token } = await approvalController.getApprovalToken('post-1');
      const result = await approvalController.submitApproval(token, {
        action: 'reject',
        feedback: 'Violates brand tone',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('Rejected');
      expect(result.actionExecuted).toBe('reject');
      expect(result.feedback).toBe('Violates brand tone');
    });

    it('should throw BadRequestException if action field is invalid', async () => {
      const { token } = await approvalController.getApprovalToken('post-1');
      await expect(
        approvalController.submitApproval(token, { action: 'invalid' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if feedback is missing on rejection', async () => {
      const { token } = await approvalController.getApprovalToken('post-1');
      await expect(
        approvalController.submitApproval(token, { action: 'reject' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce single-use: reject a second submission when post is no longer PendingApproval', async () => {
      // Simulate post already actioned (status changed)
      jest.spyOn(prismaService.post, 'findUnique').mockResolvedValueOnce({
        id: 'post-1',
        status: 'Scheduled', // already approved
      } as any);

      const { token } = await approvalController.getApprovalToken('post-1');
      await expect(
        approvalController.submitApproval(token, { action: 'approve' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate a portal token and URL and dispatch client email', async () => {
      const sendEmailSpy = jest.spyOn(notificationsService, 'sendEmail');

      const res = await approvalController.getApprovalToken('post-1');
      expect(res).toBeDefined();
      expect(res.token).toBeDefined();
      expect(res.portalUrl).toContain('/approval/');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'client@example.com',
        expect.stringContaining('Action Required: Approve Post Draft'),
        expect.any(String),
        'ws-1',
      );
    });

    it('should validate a signed token successfully', async () => {
      const { token } = await approvalController.getApprovalToken('post-1');
      const res = await approvalController.validateApprovalToken(token);
      expect(res).toBeDefined();
      expect(res.postId).toBe('post-1');
      expect(res.content).toBe('Check out Fluxora!');
    });

    it('should throw BadRequestException if token is missing or invalid on validation', async () => {
      await expect(
        approvalController.validateApprovalToken(''),
      ).rejects.toThrow(BadRequestException);

      await expect(
        approvalController.validateApprovalToken('invalid.token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should submit client review via token and return post status and notify creator', async () => {
      const sendEmailSpy = jest.spyOn(notificationsService, 'sendEmail');
      const { token } = await approvalController.getApprovalToken('post-1');

      sendEmailSpy.mockClear();
      const res = await approvalController.submitApproval(token, {
        action: 'approve',
      });
      expect(res).toBeDefined();
      expect(res.status).toBe('Scheduled');
      expect(res.actionExecuted).toBe('approve');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'creator@example.com',
        expect.stringContaining('Post post-1 has been Approved'),
        expect.any(String),
        'ws-1',
      );

      sendEmailSpy.mockClear();
      const resReject = await approvalController.submitApproval(token, {
        action: 'reject',
        feedback: 'Please refine text',
      });
      expect(resReject.status).toBe('Rejected');
      expect(resReject.feedback).toBe('Please refine text');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        'creator@example.com',
        expect.stringContaining('Post post-1 has been Rejected'),
        expect.any(String),
        'ws-1',
      );
    });
  });
});
