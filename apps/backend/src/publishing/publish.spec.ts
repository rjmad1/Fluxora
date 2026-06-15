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

describe('Social Media Publishing & Queue Activities', () => {
  let adaptersService: SocialAdaptersService;
  let publishActivities: PublishActivities;
  let vaultService: VaultService;
  let prismaService: PrismaService;
  let publishController: PublishController;
  let approvalController: ApprovalController;
  let tenantService: TenantService;

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
                  workspace: {
                    id: 'ws-1',
                    tenantId: 'tenant-123',
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
      expect(prismaService.telemetryEvent.create).toHaveBeenCalled();
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
    it('should process client approval, update database status, and schedule job', async () => {
      const result = await approvalController.handleApprovalAction('post-1', {
        action: 'approve',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('Scheduled');
      expect(result.actionExecuted).toBe('approve');
      expect(prismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'Scheduled' },
        include: { workspace: true },
      });
      expect(mockBullQueue.add).toHaveBeenCalled();
    });

    it('should process client rejection, update status, and log feedback', async () => {
      const result = await approvalController.handleApprovalAction('post-1', {
        action: 'reject',
        feedback: 'Violates brand tone',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('Rejected');
      expect(result.actionExecuted).toBe('reject');
      expect(prismaService.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'Rejected' },
        include: { workspace: true },
      });
    });

    it('should throw BadRequestException if action is invalid', async () => {
      await expect(
        approvalController.handleApprovalAction('post-1', {
          action: 'invalid' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if feedback is missing for rejection', async () => {
      await expect(
        approvalController.handleApprovalAction('post-1', {
          action: 'reject',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate a portal token and URL', async () => {
      const res = await approvalController.getApprovalToken('post-1');
      expect(res).toBeDefined();
      expect(res.token).toBeDefined();
      expect(res.portalUrl).toContain('/approval/');
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

    it('should submit client review via token and return post status', async () => {
      const { token } = await approvalController.getApprovalToken('post-1');
      const res = await approvalController.submitApproval(token, {
        action: 'approve',
      });
      expect(res).toBeDefined();
      expect(res.status).toBe('Scheduled');
      expect(res.actionExecuted).toBe('approve');

      const resReject = await approvalController.submitApproval(token, {
        action: 'reject',
        feedback: 'Please refine text',
      });
      expect(resReject.status).toBe('Rejected');
      expect(resReject.feedback).toBe('Please refine text');
    });
  });
});
