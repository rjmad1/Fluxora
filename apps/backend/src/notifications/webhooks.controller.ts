import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import * as crypto from 'crypto';

interface CreateWebhookDto {
  url: string;
  eventTypes: string[];
  secret?: string;
}

interface UpdateWebhookDto {
  url?: string;
  eventTypes?: string[];
  active?: boolean;
  secret?: string;
}

@Controller('api/v1/automations/webhooks')
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  @Get()
  async getSubscriptions() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    return this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  @Get('logs')
  async getDeliveryLogs() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    return this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookDeliveryLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  }

  @Post()
  async createSubscription(@Body() dto: CreateWebhookDto) {
    const { url, eventTypes, secret } = dto;
    if (!url || !eventTypes || !Array.isArray(eventTypes)) {
      throw new BadRequestException(
        'Missing required fields: url, eventTypes (array)',
      );
    }

    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const finalSecret =
      secret || 'fluxora_whs_' + crypto.randomBytes(16).toString('hex');

    return this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.create({
        data: {
          workspaceId,
          url,
          eventTypes,
          active: true,
          secret: finalSecret,
        },
      });
    });
  }

  @Put(':id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const sub = await this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.findFirst({
        where: { id, workspaceId },
      });
    });

    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const data: any = {};
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.eventTypes !== undefined) data.eventTypes = dto.eventTypes;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.secret !== undefined) data.secret = dto.secret;

    return this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.update({
        where: { id },
        data,
      });
    });
  }

  @Delete(':id')
  async deleteSubscription(@Param('id') id: string) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }

    const sub = await this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.findFirst({
        where: { id, workspaceId },
      });
    });

    if (!sub) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    await this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.delete({
        where: { id },
      });
    });

    return { success: true };
  }
}
