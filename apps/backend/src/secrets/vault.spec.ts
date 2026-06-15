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

  // Mock Vault Client interface
  const mockVaultClient = {
    write: jest.fn(),
    read: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultService,
        OAuthController,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'VAULT_ADDR') return 'http://mock-vault:8200';
              if (key === 'VAULT_TOKEN') return 'mock-token';
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
                      vaultSecretId: data.vaultSecretId,
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

    // Inject the mocked vault client directly
    (vaultService as any).client = mockVaultClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('VaultService', () => {
    it('should successfully write secret to Vault KV store', async () => {
      mockVaultClient.write.mockResolvedValue({ success: true });

      const expires = new Date();
      await vaultService.setAccountTokens(
        'acc-123',
        'access-tok',
        'refresh-tok',
        expires,
      );

      expect(mockVaultClient.write).toHaveBeenCalledWith(
        'secret/data/workspaces/accounts/account-acc-123',
        {
          data: {
            accessToken: 'access-tok',
            refreshToken: 'refresh-tok',
            expiresAt: expires.toISOString(),
          },
        },
      );
    });

    it('should successfully read secret from Vault KV store', async () => {
      mockVaultClient.read.mockResolvedValue({
        data: {
          data: {
            accessToken: 'access-val',
            refreshToken: 'refresh-val',
            expiresAt: '2026-06-15T12:00:00.000Z',
          },
        },
      });

      const secrets = await vaultService.getAccountTokens('acc-123');

      expect(mockVaultClient.read).toHaveBeenCalledWith(
        'secret/data/workspaces/accounts/account-acc-123',
      );
      expect(secrets).toEqual({
        accessToken: 'access-val',
        refreshToken: 'refresh-val',
        expiresAt: '2026-06-15T12:00:00.000Z',
      });
    });

    it('should throw InternalServerErrorException if Vault write fails', async () => {
      mockVaultClient.write.mockRejectedValue(new Error('Network error'));

      await expect(
        vaultService.setAccountTokens('acc-123', 'tok'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('OAuthController', () => {
    it('should successfully complete OAuth callback, save to Vault, and save to DB', async () => {
      mockVaultClient.write.mockResolvedValue({ success: true });

      const result = await oauthController.handleOAuthCallback({
        provider: 'linkedin',
        code: 'auth-code',
        redirectUri: 'http://localhost/callback',
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('linkedin');
      expect(result.status).toBe('ACTIVE');
      expect(result.avatarUrl).toContain('linkedin');
      expect(mockVaultClient.write).toHaveBeenCalled();
      expect(prismaService.runInWorkspace).toHaveBeenCalled();
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
