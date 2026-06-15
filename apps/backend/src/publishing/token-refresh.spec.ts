import { Test, TestingModule } from '@nestjs/testing';
import { TokenRefreshActivities } from './token-refresh.activities';
import { PrismaService } from '../tenant/prisma.service';
import { VaultService } from '../secrets/vault.service';

describe('TokenRefreshActivities', () => {
  let activities: TokenRefreshActivities;
  let prisma: PrismaService;
  let vaultService: VaultService;

  const mockPrisma = {
    connectedAccount: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockVaultService = {
    getAccountTokens: jest.fn(),
    setAccountTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRefreshActivities,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: VaultService,
          useValue: mockVaultService,
        },
      ],
    }).compile();

    activities = module.get<TokenRefreshActivities>(TokenRefreshActivities);
    prisma = module.get<PrismaService>(PrismaService);
    vaultService = module.get<VaultService>(VaultService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully refresh, vault, and update account tokens', async () => {
    const accountId = 'acc-123';
    mockPrisma.connectedAccount.findUnique.mockResolvedValue({
      id: accountId,
      provider: 'linkedin',
      status: 'EXPIRED',
    });
    mockVaultService.getAccountTokens.mockResolvedValue({
      refreshToken: 'valid-refresh-token',
    });
    mockVaultService.setAccountTokens.mockResolvedValue(undefined);
    mockPrisma.connectedAccount.update.mockResolvedValue({
      id: accountId,
      status: 'ACTIVE',
    });

    const expiresIn = await activities.refreshAccountTokenActivity(accountId);

    expect(expiresIn).toBe(3600);
    expect(prisma.connectedAccount.findUnique).toHaveBeenCalledWith({
      where: { id: accountId },
    });
    expect(vaultService.getAccountTokens).toHaveBeenCalledWith(accountId);
    expect(vaultService.setAccountTokens).toHaveBeenCalledWith(
      accountId,
      expect.stringContaining('refreshed_access_token_'),
      expect.stringContaining('refreshed_refresh_token_'),
      expect.any(Date),
    );
    expect(prisma.connectedAccount.update).toHaveBeenCalledWith({
      where: { id: accountId },
      data: { status: 'ACTIVE' },
    });
  });

  it('should throw an error if account is not found in database', async () => {
    const accountId = 'nonexistent-acc';
    mockPrisma.connectedAccount.findUnique.mockResolvedValue(null);

    await expect(
      activities.refreshAccountTokenActivity(accountId),
    ).rejects.toThrow('ConnectedAccount nonexistent-acc not found in database');

    expect(vaultService.getAccountTokens).not.toHaveBeenCalled();
  });

  it('should throw an error if refresh token is missing in Vault', async () => {
    const accountId = 'acc-123';
    mockPrisma.connectedAccount.findUnique.mockResolvedValue({
      id: accountId,
      provider: 'twitter',
      status: 'ACTIVE',
    });
    mockVaultService.getAccountTokens.mockResolvedValue({
      refreshToken: null,
    });

    await expect(
      activities.refreshAccountTokenActivity(accountId),
    ).rejects.toThrow(
      'No refresh token available in Vault for account acc-123',
    );

    expect(vaultService.setAccountTokens).not.toHaveBeenCalled();
    expect(prisma.connectedAccount.update).not.toHaveBeenCalled();
  });
});
