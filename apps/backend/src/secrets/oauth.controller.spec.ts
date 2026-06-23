import { Test, TestingModule } from '@nestjs/testing';
import { OAuthController } from './oauth.controller';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { VaultService } from './vault.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OAuthController', () => {
  let controller: OAuthController;
  let prismaService: any;
  let tenantService: any;
  let vaultService: any;
  let configService: any;

  beforeEach(async () => {
    prismaService = {
      connectedAccount: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      },
      runInWorkspace: jest.fn((cb) => cb(prismaService)),
    };

    tenantService = {
      getWorkspaceId: jest.fn().mockReturnValue('ws-1'),
    };

    vaultService = {
      setAccountTokens: jest.fn(),
      deleteAccountTokens: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        { provide: PrismaService, useValue: prismaService },
        { provide: TenantService, useValue: tenantService },
        { provide: VaultService, useValue: vaultService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<OAuthController>(OAuthController);
  });

  describe('getOAuthUrl', () => {
    it('should generate valid LinkedIn OAuth URL', async () => {
      configService.get.mockReturnValue('client-123');
      const res = await controller.getOAuthUrl(
        'linkedin',
        'http://localhost/integrations',
      );
      expect(res.url).toContain(
        'https://www.linkedin.com/oauth/v2/authorization',
      );
      expect(res.url).toContain('client_id=client-123');
      expect(res.url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%2Fintegrations',
      );
    });

    it('should throw BadRequestException for unsupported provider', async () => {
      await expect(
        controller.getOAuthUrl('unsupported', 'http://localhost/integrations'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConnectedAccounts', () => {
    it('should list all connected accounts in active workspace', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          provider: 'linkedin',
          name: 'LinkedIn Channel',
          avatarUrl: 'http://avatar',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ];
      prismaService.connectedAccount.findMany.mockResolvedValue(mockAccounts);

      const res = await controller.getConnectedAccounts();
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('acc-1');
      expect(prismaService.connectedAccount.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
      });
    });
  });

  describe('disconnectAccount', () => {
    it('should successfully disconnect active account and clear vault secrets', async () => {
      const mockAccount = { id: 'acc-1', provider: 'linkedin' };
      prismaService.connectedAccount.findFirst.mockResolvedValue(mockAccount);

      const res = await controller.disconnectAccount('acc-1');
      expect(res.success).toBe(true);
      expect(vaultService.deleteAccountTokens).toHaveBeenCalledWith('acc-1');
      expect(prismaService.connectedAccount.delete).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
      });
    });

    it('should throw NotFoundException if account does not exist in workspace', async () => {
      prismaService.connectedAccount.findFirst.mockResolvedValue(null);
      await expect(controller.disconnectAccount('acc-invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('handleOAuthCallback', () => {
    it('should successfully onboard account and store in Vault using mock callback if configs not set', async () => {
      prismaService.connectedAccount.create.mockResolvedValue({
        id: 'acc-new',
        provider: 'linkedin',
        name: 'LinkedIn Channel Account',
        avatarUrl: 'https://avatar.example/linkedin-avatar.png',
        status: 'ACTIVE',
      });

      const res = await controller.handleOAuthCallback({
        provider: 'linkedin',
        code: 'auth-code-123',
        redirectUri: 'http://localhost/integrations',
      });

      expect(res).toBeDefined();
      expect(res.provider).toBe('linkedin');
      expect(vaultService.setAccountTokens).toHaveBeenCalled();
      expect(prismaService.connectedAccount.create).toHaveBeenCalled();
    });
  });
});
