import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { KongService } from './kong.service';
import * as crypto from 'node:crypto';

@Controller('api/v1/developer/api-keys')
export class ApiKeysController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly kongService: KongService,
  ) {}

  @Get()
  async getApiKeys() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    return this.prisma.runInWorkspace(async (tx) => {
      return tx.apiKey.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  @Post()
  async generateApiKey() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    // Generate a new API key with the required format
    const randomHex1 = crypto.randomBytes(8).toString('hex');
    const randomHex2 = crypto.randomBytes(6).toString('hex');
    const newKey = `fluxora_live_${randomHex1}${randomHex2}`;

    // Proceed to create the new key
    const createdKey = await this.prisma.runInWorkspace(async (tx) => {
      // For simplicity in this implementation, we will allow multiple keys per workspace.
      return tx.apiKey.create({
        data: {
          workspaceId,
          key: newKey,
          name: 'Developer Portal Key',
        },
      });
    });

    // Mock syncing to Kong
    await this.kongService.syncConsumerKey(workspaceId, newKey);

    return createdKey;
  }

  @Delete(':id')
  async deleteApiKey(@Param('id') id: string) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const apiKeyEntry = await this.prisma.runInWorkspace(async (tx) => {
      return tx.apiKey.findFirst({
        where: { id, workspaceId },
      });
    });

    if (!apiKeyEntry) {
      throw new NotFoundException(`API Key with ID ${id} not found`);
    }

    await this.prisma.runInWorkspace(async (tx) => {
      return tx.apiKey.delete({
        where: { id },
      });
    });

    // Mock revoking from Kong
    await this.kongService.revokeConsumerKey(apiKeyEntry.key);

    return { success: true };
  }
}
