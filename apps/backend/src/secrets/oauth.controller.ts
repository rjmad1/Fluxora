import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { VaultService } from './vault.service';
import { randomUUID } from 'crypto';
import axios from 'axios';

interface OAuthCallbackDto {
  provider: string;
  code: string;
  redirectUri: string;
}

@Controller('api/v1/accounts')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tenantService: TenantService,
    private readonly vaultService: VaultService,
    private readonly configService: ConfigService,
  ) {}

  @Get('oauth/url')
  async getOAuthUrl(
    @Query('provider') provider: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    if (!provider || !redirectUri) {
      throw new BadRequestException(
        'Missing required fields: provider, redirectUri',
      );
    }

    if (provider.toLowerCase() === 'linkedin') {
      const clientId =
        this.configService.get<string>('LINKEDIN_CLIENT_ID') ||
        'mock-linkedin-client-id';
      const scope = encodeURIComponent('w_member_social openid profile email');
      const state = randomUUID();
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
      return { url: authUrl };
    }

    throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
  }

  @Get()
  async getConnectedAccounts() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }
    const accounts = await this.prismaService.connectedAccount.findMany({
      where: { workspaceId },
    });
    return accounts.map((acc) => ({
      id: acc.id,
      provider: acc.provider,
      name: acc.name,
      avatarUrl: acc.avatarUrl,
      status: acc.status,
      createdAt: acc.createdAt,
    }));
  }

  @Delete(':id')
  async disconnectAccount(@Param('id') id: string) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const account = await this.prismaService.connectedAccount.findFirst({
      where: { id, workspaceId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found in this workspace`);
    }

    await this.vaultService.deleteAccountTokens(id);
    await this.prismaService.connectedAccount.delete({
      where: { id },
    });
    return { success: true };
  }

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

    // 1. Exchange auth code for tokens
    let accessToken = `mock_access_token_${provider}_${Math.random().toString(36).substring(2)}`;
    let refreshToken = `mock_refresh_token_${provider}_${Math.random().toString(36).substring(2)}`;
    let expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration
    let name = `${provider.charAt(0).toUpperCase() + provider.slice(1)} Channel Account`;
    let avatarUrl = `https://avatar.example/${provider}-avatar.png`;

    if (provider.toLowerCase() === 'linkedin') {
      const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'LINKEDIN_CLIENT_SECRET',
      );

      if (clientId && clientSecret) {
        try {
          this.logger.log(`Exchanging code for LinkedIn access token...`);
          const tokenRes = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri,
              client_id: clientId,
              client_secret: clientSecret,
            }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
          );

          if (tokenRes.data && tokenRes.data.access_token) {
            accessToken = tokenRes.data.access_token;
            refreshToken = tokenRes.data.refresh_token || null;
            if (tokenRes.data.expires_in) {
              expiresAt = new Date(
                Date.now() + tokenRes.data.expires_in * 1000,
              );
            }

            // Retrieve profile information from OIDC userinfo endpoint
            try {
              this.logger.log(`Fetching LinkedIn user profile...`);
              const profileRes = await axios.get(
                'https://api.linkedin.com/v2/userinfo',
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              if (profileRes.data) {
                if (profileRes.data.name) {
                  name = profileRes.data.name;
                } else if (
                  profileRes.data.given_name ||
                  profileRes.data.family_name
                ) {
                  name =
                    `${profileRes.data.given_name || ''} ${profileRes.data.family_name || ''}`.trim() ||
                    name;
                }
                avatarUrl = profileRes.data.picture || avatarUrl;
              }
            } catch (profileErr: any) {
              this.logger.warn(
                `Failed to fetch LinkedIn profile: ${profileErr.message}`,
              );
              // Fallback to /v2/me
              try {
                const meRes = await axios.get(
                  'https://api.linkedin.com/v2/me',
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  },
                );
                if (meRes.data) {
                  const first = meRes.data.localizedFirstName;
                  const last = meRes.data.localizedLastName;
                  if (first || last) {
                    name = `${first || ''} ${last || ''}`.trim() || name;
                  }
                }
              } catch (meErr: any) {
                this.logger.warn(
                  `Failed to fetch LinkedIn profile via /v2/me: ${meErr.message}`,
                );
              }
            }
          } else {
            throw new Error('No access_token returned from LinkedIn');
          }
        } catch (err: any) {
          const errMsg = err.response?.data?.error_description || err.message;
          this.logger.error(`LinkedIn token exchange failed: ${errMsg}`);
          throw new BadRequestException(
            `LinkedIn token exchange failed: ${errMsg}`,
          );
        }
      } else {
        this.logger.warn(
          'LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not configured. Falling back to Mock authentication.',
        );
      }
    }

    // 2. Generate a new UUID for the connected account
    const accountId = randomUUID();

    try {
      // 3. Persist account metadata in database within tenant workspace scope
      const account = await this.prismaService.runInWorkspace(async (tx) => {
        return tx.connectedAccount.create({
          data: {
            id: accountId,
            workspaceId,
            provider: provider.toLowerCase(),
            name,
            avatarUrl,
            encryptedAccessToken: '',
            encryptedRefreshToken: null,
            tokenExpiresAt: null,
            status: 'ACTIVE',
          },
        });
      });

      // 4. Store tokens securely
      await this.vaultService.setAccountTokens(
        accountId,
        accessToken,
        refreshToken,
        expiresAt,
      );

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
        this.logger.warn(
          `Failed to cleanup Vault credentials: ${cleanupError.message}`,
        );
      }

      throw new InternalServerErrorException(
        `OAuth onboarding failed: ${error.message}`,
      );
    }
  }
}
