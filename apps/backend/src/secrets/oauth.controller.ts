import {
  Controller,
  Post,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { VaultService } from './vault.service';

interface OAuthCallbackDto {
  provider: string;
  code: string;
  redirectUri: string;
}

@Controller('api/v1/accounts')
export class OAuthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tenantService: TenantService,
    private readonly vaultService: VaultService,
  ) {}

  @Post('oauth/callback')
  async handleOAuthCallback(@Body() dto: OAuthCallbackDto) {
    const { provider, code, redirectUri } = dto;
    if (!provider || !code || !redirectUri) {
      throw new BadRequestException(
        'Missing required fields: provider, code, redirectUri',
      );
    }

    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    // 1. Simulate exchanging auth code for tokens (OAuth handshake)
    const mockAccessToken = `mock_access_token_${provider}_${Math.random().toString(36).substring(2)}`;
    const mockRefreshToken = `mock_refresh_token_${provider}_${Math.random().toString(36).substring(2)}`;
    const mockExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    // 2. Generate a new UUID for the connected account
    const { randomUUID } = require('crypto');
    const accountId = randomUUID();

    try {
      // 3. Store tokens securely in Vault
      await this.vaultService.setAccountTokens(
        accountId,
        mockAccessToken,
        mockRefreshToken,
        mockExpiresAt,
      );

      // 4. Persist account metadata in database within tenant workspace scope
      const account = await this.prismaService.runInWorkspace(async (tx) => {
        return tx.connectedAccount.create({
          data: {
            id: accountId,
            workspaceId,
            provider,
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Channel Account`,
            avatarUrl: `https://avatar.example/${provider}-avatar.png`,
            vaultSecretId: `workspaces/accounts/account-${accountId}`,
            status: 'ACTIVE',
          },
        });
      });

      return {
        id: account.id,
        provider: account.provider,
        name: account.name,
        avatarUrl: account.avatarUrl,
        status: account.status,
      };
    } catch (error) {
      // Cleanup Vault if DB create fails
      try {
        await this.vaultService.deleteAccountTokens(accountId);
      } catch (cleanupError) {
        const { Logger } = require('@nestjs/common');
        new Logger('OAuthController').warn(
          `Failed to cleanup Vault credentials: ${cleanupError.message}`,
        );
      }

      throw new InternalServerErrorException(
        `OAuth onboarding failed: ${error.message}`,
      );
    }
  }
}
