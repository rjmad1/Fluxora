import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { VaultService } from '../secrets/vault.service';

@Injectable()
export class TokenRefreshActivities {
  private readonly logger = new Logger(TokenRefreshActivities.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
  ) {}

  async refreshAccountTokenActivity(accountId: string): Promise<number> {
    this.logger.log(
      `Temporal activity starting: refreshing token for account ${accountId}`,
    );

    // 1. Fetch metadata from DB
    const account = await this.prisma.connectedAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`ConnectedAccount ${accountId} not found in database`);
    }

    // 2. Fetch current credentials from Vault
    const vaultCredentials =
      await this.vaultService.getAccountTokens(accountId);
    if (!vaultCredentials.refreshToken) {
      throw new Error(
        `No refresh token available in Vault for account ${accountId}`,
      );
    }

    this.logger.log(`Exchanging refresh token for ${account.provider}...`);

    // 3. Simulate refreshing the OAuth token via the provider's API
    const newAccessToken = `refreshed_access_token_${account.provider}_${Math.random().toString(36).substring(2)}`;
    const newRefreshToken = `refreshed_refresh_token_${account.provider}_${Math.random().toString(36).substring(2)}`;
    const expiresInSeconds = 3600; // 1 hour expiration
    const newExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 4. Write new tokens to Vault
    await this.vaultService.setAccountTokens(
      accountId,
      newAccessToken,
      newRefreshToken,
      newExpiresAt,
    );

    // 5. Update database account status/metadata if necessary
    await this.prisma.connectedAccount.update({
      where: { id: accountId },
      data: {
        status: 'ACTIVE',
      },
    });

    this.logger.log(
      `Successfully refreshed and vaulted tokens for account ${accountId}`,
    );
    return expiresInSeconds;
  }
}
