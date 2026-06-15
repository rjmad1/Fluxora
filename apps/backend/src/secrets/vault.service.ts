import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../tenant/prisma.service';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  private vaultUrl = 'http://localhost:8200';
  private vaultToken = 'my-root-token';
  private isVaultActive = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.vaultUrl = this.configService.get<string>(
      'VAULT_URL',
      'http://localhost:8200',
    );
    this.vaultToken = this.configService.get<string>(
      'VAULT_TOKEN',
      'my-root-token',
    );
  }

  async onModuleInit() {
    // Local fallback key initialization
    const keyHex =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      '57652061726520746865206368616d70696f6e73206d7920667269656e642121';

    try {
      this.encryptionKey = Buffer.from(keyHex, 'hex');
      if (this.encryptionKey.length !== 32) {
        throw new Error('Key must be exactly 32 bytes');
      }
    } catch (err) {
      const keyBuffer = crypto.createHash('sha256').update(keyHex).digest();
      this.encryptionKey = keyBuffer;
    }

    // Ping HashiCorp Vault health endpoint to check connection
    try {
      this.logger.log(`Connecting to HashiCorp Vault at ${this.vaultUrl}...`);
      const response = await axios.get(`${this.vaultUrl}/v1/sys/health`, {
        headers: { 'X-Vault-Token': this.vaultToken },
        timeout: 2000,
      });
      // status 200 = initialized, unsealed, and active
      if (response.status === 200 || response.status === 429) {
        this.isVaultActive = true;
        this.logger.log(
          'Successfully connected to HashiCorp Vault. Vault storage active.',
        );
      } else {
        throw new Error(`Vault returned status: ${response.status}`);
      }
    } catch (err) {
      this.isVaultActive = false;
      this.logger.warn(
        `HashiCorp Vault unreachable. Operating in local database encryption fallback mode: ${err.message}`,
      );
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, tagHex, encryptedData] = encryptedText.split(':');
    if (!ivHex || !tagHex || !encryptedData) {
      throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async setAccountTokens(
    accountId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
  ): Promise<void> {
    if (this.isVaultActive) {
      const vaultPath = `secret/data/workspaces/accounts/account-${accountId}`;
      try {
        this.logger.log(`Writing tokens to HashiCorp Vault path: ${vaultPath}`);
        await axios.post(
          `${this.vaultUrl}/v1/${vaultPath}`,
          {
            data: {
              accessToken,
              refreshToken: refreshToken || null,
              expiresAt: expiresAt ? expiresAt.toISOString() : null,
            },
          },
          {
            headers: {
              'X-Vault-Token': this.vaultToken,
              'Content-Type': 'application/json',
            },
          },
        );

        // Store the vault path reference in the database as a marker
        await this.prisma.connectedAccount.update({
          where: { id: accountId },
          data: {
            encryptedAccessToken: `vault:${vaultPath}`,
            encryptedRefreshToken: null,
            tokenExpiresAt: expiresAt || null,
          },
        });
        return;
      } catch (err) {
        this.logger.error(
          `Failed to save tokens to HashiCorp Vault: ${err.message}. Falling back to database encryption.`,
        );
      }
    }

    try {
      const encryptedAccessToken = this.encrypt(accessToken);
      const encryptedRefreshToken = refreshToken
        ? this.encrypt(refreshToken)
        : null;

      await this.prisma.connectedAccount.update({
        where: { id: accountId },
        data: {
          encryptedAccessToken,
          encryptedRefreshToken,
          tokenExpiresAt: expiresAt || null,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to encrypt and save tokens: ${error.message}`,
      );
    }
  }

  async getAccountTokens(accountId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  }> {
    try {
      const account = await this.prisma.connectedAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundException(`Connected account ${accountId} not found`);
      }

      if (account.encryptedAccessToken.startsWith('vault:')) {
        const vaultPath = account.encryptedAccessToken.replace('vault:', '');
        try {
          this.logger.log(
            `Reading credentials from HashiCorp Vault path: ${vaultPath}`,
          );
          const res = await axios.get(`${this.vaultUrl}/v1/${vaultPath}`, {
            headers: { 'X-Vault-Token': this.vaultToken },
          });
          const secretData = res.data.data.data;
          return {
            accessToken: secretData.accessToken,
            refreshToken: secretData.refreshToken || undefined,
            expiresAt: secretData.expiresAt || undefined,
          };
        } catch (err) {
          this.logger.error(
            `Failed to read credentials from HashiCorp Vault: ${err.message}`,
          );
          throw new InternalServerErrorException(
            `HashiCorp Vault read error: ${err.message}`,
          );
        }
      }

      // Local fallback decrypt
      const accessToken = this.decrypt(account.encryptedAccessToken);
      const refreshToken = account.encryptedRefreshToken
        ? this.decrypt(account.encryptedRefreshToken)
        : undefined;

      return {
        accessToken,
        refreshToken,
        expiresAt: account.tokenExpiresAt
          ? account.tokenExpiresAt.toISOString()
          : undefined,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to decrypt and read tokens: ${error.message}`,
      );
    }
  }

  async deleteAccountTokens(accountId: string): Promise<void> {
    try {
      const account = await this.prisma.connectedAccount.findUnique({
        where: { id: accountId },
      });

      if (account && account.encryptedAccessToken.startsWith('vault:')) {
        const vaultPath = account.encryptedAccessToken.replace('vault:', '');
        try {
          this.logger.log(
            `Deleting tokens from HashiCorp Vault metadata: ${vaultPath}`,
          );
          const metadataPath = vaultPath.replace(
            'secret/data/',
            'secret/metadata/',
          );
          await axios.delete(`${this.vaultUrl}/v1/${metadataPath}`, {
            headers: { 'X-Vault-Token': this.vaultToken },
          });
        } catch (err) {
          this.logger.warn(`Failed to delete Vault secret: ${err.message}`);
        }
      }

      await this.prisma.connectedAccount.update({
        where: { id: accountId },
        data: {
          encryptedAccessToken: '',
          encryptedRefreshToken: null,
          tokenExpiresAt: null,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to remove tokens: ${error.message}`,
      );
    }
  }

  getIsVaultActive(): boolean {
    return this.isVaultActive;
  }
}
