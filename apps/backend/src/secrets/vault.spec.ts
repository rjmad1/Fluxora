import { Test, TestingModule } from '@nestjs/testing';
import { VaultService } from './vault.service';
import { OAuthController } from './oauth.controller';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('Vault Credentials Storage & OAuth Handshake', () => {
  let vaultService: VaultService;
  let oauthController: OAuthController;
  let tenantService: TenantService;
  let prismaService: PrismaService;

  // Mock DB state
  const mockDb = {
    encryptedAccessToken: '',
    encryptedRefreshToken: '',
    tokenExpiresAt: null as Date | null,
  };

  beforeEach(async () => {
    mockDb.encryptedAccessToken = '';
    mockDb.encryptedRefreshToken = '';
    mockDb.tokenExpiresAt = null;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultService,
        OAuthController,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'ENCRYPTION_KEY') {
                return '57652061726520746865206368616d70696f6e73206d7920667269656e642121';
              }
              return null;
            }),
          },
        },
        {
          provide: TenantService,
          useValue: {
            getWorkspaceId: jest.fn().mockReturnValue('workspace-test-id'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            connectedAccount: {
              findUnique: jest.fn().mockImplementation(() =>
                Promise.resolve({
                  id: 'acc-123',
                  workspaceId: 'workspace-test-id',
                  provider: 'linkedin',
                  name: 'LinkedIn Channel Account',
                  avatarUrl: 'https://avatar.example/linkedin-avatar.png',
                  encryptedAccessToken: mockDb.encryptedAccessToken,
                  encryptedRefreshToken: mockDb.encryptedRefreshToken,
                  tokenExpiresAt: mockDb.tokenExpiresAt,
                  status: 'ACTIVE',
                  createdAt: new Date(),
                }),
              ),
              update: jest.fn().mockImplementation(({ data }) => {
                if (data.encryptedAccessToken !== undefined) {
                  mockDb.encryptedAccessToken = data.encryptedAccessToken;
                }
                if (data.encryptedRefreshToken !== undefined) {
                  mockDb.encryptedRefreshToken = data.encryptedRefreshToken;
                }
                if (data.tokenExpiresAt !== undefined) {
                  mockDb.tokenExpiresAt = data.tokenExpiresAt;
                }
                return Promise.resolve({
                  id: 'acc-123',
                  status: 'ACTIVE',
                });
              }),
            },
            runInWorkspace: jest.fn((cb) =>
              cb({
                connectedAccount: {
                  create: jest.fn().mockImplementation(({ data }) =>
                    Promise.resolve({
                      id: data.id,
                      workspaceId: data.workspaceId,
                      provider: data.provider,
                      name: data.name,
                      avatarUrl: data.avatarUrl,
                      status: data.status,
                    }),
                  ),
                },
              }),
            ),
          },
        },
      ],
    }).compile();

    vaultService = module.get<VaultService>(VaultService);
    oauthController = module.get<OAuthController>(OAuthController);
    tenantService = module.get<TenantService>(TenantService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Call onModuleInit to construct the key
    await vaultService.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('VaultService (Local Encryption)', () => {
    it('should successfully encrypt and save tokens to PostgreSQL', async () => {
      const expires = new Date();
      await vaultService.setAccountTokens(
        'acc-123',
        'access-tok',
        'refresh-tok',
        expires,
      );

      expect(prismaService.connectedAccount.update).toHaveBeenCalled();
      expect(mockDb.encryptedAccessToken).not.toBe('access-tok'); // Should be encrypted
      expect(mockDb.encryptedAccessToken).toContain(':'); // Cipher contains format separators
    });

    it('should successfully read and decrypt secrets from PostgreSQL', async () => {
      const expires = new Date();
      // Set tokens first to populate mocked database state
      await vaultService.setAccountTokens(
        'acc-123',
        'access-val',
        'refresh-val',
        expires,
      );

      const secrets = await vaultService.getAccountTokens('acc-123');

      expect(prismaService.connectedAccount.findUnique).toHaveBeenCalled();
      expect(secrets.accessToken).toBe('access-val');
      expect(secrets.refreshToken).toBe('refresh-val');
    });

    it('should throw InternalServerErrorException if DB write fails', async () => {
      jest
        .spyOn(prismaService.connectedAccount, 'update')
        .mockRejectedValue(new Error('Database write constraint violation'));

      await expect(
        vaultService.setAccountTokens('acc-123', 'tok'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('OAuthController', () => {
    it('should successfully complete OAuth callback, save and encrypt tokens, and save to DB', async () => {
      const result = await oauthController.handleOAuthCallback({
        provider: 'linkedin',
        code: 'auth-code',
        redirectUri: 'http://localhost/callback',
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('linkedin');
      expect(result.status).toBe('ACTIVE');
      expect(prismaService.runInWorkspace).toHaveBeenCalled();
      expect(prismaService.connectedAccount.update).toHaveBeenCalled();
      expect(mockDb.encryptedAccessToken).toBeDefined();
    });

    it('should throw BadRequestException if workspace context is missing', async () => {
      jest.spyOn(tenantService, 'getWorkspaceId').mockReturnValue(undefined);

      await expect(
        oauthController.handleOAuthCallback({
          provider: 'linkedin',
          code: 'auth-code',
          redirectUri: 'http://localhost/callback',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payload parameters are missing', async () => {
      await expect(
        oauthController.handleOAuthCallback({
          provider: '',
          code: 'auth-code',
          redirectUri: 'http://localhost/callback',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
