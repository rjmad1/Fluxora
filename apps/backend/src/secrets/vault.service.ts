import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import vault from 'node-vault';

@Injectable()
export class VaultService implements OnModuleInit {
  private client: vault.client;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const endpoint =
      this.configService.get<string>('VAULT_ADDR') || 'http://localhost:8200';
    const token = this.configService.get<string>('VAULT_TOKEN') || 'dev-token';

    this.client = vault({
      apiVersion: 'v1',
      endpoint,
      token,
    });
  }

  private getPath(accountId: string): string {
    return `secret/data/workspaces/accounts/account-${accountId}`;
  }

  async setAccountTokens(
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
  ): Promise<void> {
    const path = this.getPath(accountId);
    try {
      await this.client.write(path, {
        data: {
          accessToken,
          refreshToken: refreshToken || null,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to write secret to Vault: ${error.message}`,
      );
    }
  }

  async getAccountTokens(accountId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  }> {
    const path = this.getPath(accountId);
    try {
      const response = await this.client.read(path);
      const data = response.data?.data;
      if (!data) {
        throw new Error('No secret data found at path');
      }
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || undefined,
        expiresAt: data.expiresAt || undefined,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to read secret from Vault: ${error.message}`,
      );
    }
  }

  async deleteAccountTokens(accountId: string): Promise<void> {
    const path = this.getPath(accountId);
    try {
      await this.client.delete(path);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete secret from Vault: ${error.message}`,
      );
    }
  }
}
