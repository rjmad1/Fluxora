import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../tenant/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class VaultService implements OnModuleInit {
  private encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // ENCRYPTION_KEY must be a 32-byte hex string (64 characters)
    const keyHex =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      '57652061726520746865206368616d70696f6e73206d7920667269656e642121';

    try {
      this.encryptionKey = Buffer.from(keyHex, 'hex');
      if (this.encryptionKey.length !== 32) {
        throw new Error('Key must be exactly 32 bytes');
      }
    } catch (err) {
      // Fallback dev key derivation if invalid hex or length
      const keyBuffer = crypto.createHash('sha256').update(keyHex).digest();
      this.encryptionKey = keyBuffer;
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
}
