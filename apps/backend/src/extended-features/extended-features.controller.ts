import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  Param,
  Req,
  Res,
  Query,
  Delete,
} from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { ExtendedFeaturesService } from './extended-features.service';
import * as express from 'express';

@Controller('api/v1/extended')
export class ExtendedFeaturesController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly service: ExtendedFeaturesService,
  ) {}

  private getWorkspaceOrThrow(): string {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return workspaceId;
  }

  // --- EMPLOYEE ADVOCACY ---
  @Get('advocacy/templates')
  getTemplates() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getTemplates(ws);
  }

  @Post('advocacy/share')
  shareTemplate(@Body() body: { templateId: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.templateId)
      throw new BadRequestException('Template ID is required');
    return this.service.shareTemplate(ws, body.templateId);
  }

  @Get('advocacy/leaderboard')
  getLeaderboard() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getLeaderboard(ws);
  }

  @Post('advocacy/digest')
  saveDigestConfig(
    @Body()
    body: {
      enabled: boolean;
      frequency: string;
      day: string;
      time: string;
    },
  ) {
    const ws = this.getWorkspaceOrThrow();
    return this.service.saveEmailDigestConfig(ws, body);
  }

  // --- A/B TESTING ---
  @Get('ab-testing/tests')
  getABTests() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getABTests(ws);
  }

  @Post('ab-testing/create')
  createABTest(
    @Body()
    body: {
      title: string;
      variantA: string;
      variantB: string;
      allocationA: number;
      allocationB: number;
      winnerCriteria: 'clicks' | 'engagement';
    },
  ) {
    const ws = this.getWorkspaceOrThrow();
    return this.service.createABTest(ws, body);
  }

  // --- LINK SHORTENING ---
  @Get('links/list')
  getShortenedLinks() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getShortenedLinks(ws);
  }

  @Post('links/shorten')
  shortenLink(
    @Body()
    body: {
      originalUrl: string;
      customDomain: string;
      utmSource: string;
      utmMedium: string;
      utmCampaign: string;
    },
  ) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.originalUrl)
      throw new BadRequestException('Original URL is required');
    return this.service.shortenLink(ws, body);
  }

  // --- COMPLIANCE ---
  @Get('compliance/logs')
  getAuditLogs() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getAuditLogs(ws);
  }

  @Post('compliance/check')
  @HttpCode(200)
  checkCompliance(@Body() body: { content: string }) {
    if (!body.content) throw new BadRequestException('Content is required');
    return this.service.checkComplianceContent(body.content);
  }

  @Post('compliance/security')
  saveSecurity(
    @Body()
    body: {
      twoFactorEnabled: boolean;
      retentionDays: number;
    },
  ) {
    const ws = this.getWorkspaceOrThrow();
    return this.service.saveSecurityConfig(
      ws,
      body.twoFactorEnabled,
      body.retentionDays,
    );
  }

  @Post('compliance/log-action')
  logManualAction(
    @Body()
    body: {
      action: string;
      status: string;
    },
  ) {
    const ws = this.getWorkspaceOrThrow();
    return this.service.logAction(
      ws,
      'admin@fluxora.com',
      body.action,
      body.status,
    );
  }

  // --- NEW ADVANCED SUITE ENDPOINTS ---

  @Get('inbox/messages')
  getInboxMessages() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getInboxMessages(ws);
  }

  @Post('inbox/reply')
  replyToInboxMessage(@Body() body: { messageId: string; replyText: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.messageId || !body.replyText) {
      throw new BadRequestException('Message ID and Reply Text are required');
    }
    return this.service.replyToInboxMessage(ws, body.messageId, body.replyText);
  }

  @Post('inbox/assign')
  assignInboxMessage(@Body() body: { messageId: string; assignedTo: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.messageId || !body.assignedTo) {
      throw new BadRequestException('Message ID and AssignedTo are required');
    }
    return this.service.assignInboxMessage(ws, body.messageId, body.assignedTo);
  }

  @Get('taxonomy/tags')
  getTaxonomyTags() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getTaxonomyTags(ws);
  }

  @Post('taxonomy/tags')
  createTaxonomyTag(
    @Body() tag: { name: string; color: string; description: string },
  ) {
    const ws = this.getWorkspaceOrThrow();
    if (!tag.name) throw new BadRequestException('Tag name is required');
    return this.service.createTaxonomyTag(ws, tag);
  }

  @Post('taxonomy/weights')
  saveTopicWeights(
    @Body() body: { weights: Array<{ category: string; weight: number }> },
  ) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.weights) throw new BadRequestException('Weights are required');
    return this.service.saveTopicWeights(ws, body.weights);
  }

  @Post('media/bulk-update')
  bulkUpdateMetadata(@Body() body: { assetIds: string[]; tags: string[] }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.assetIds || !body.tags) {
      throw new BadRequestException('Asset IDs and tags are required');
    }
    return this.service.bulkUpdateMetadata(ws, body.assetIds, body.tags);
  }

  @Post('media/transform')
  transformMediaItem(@Body() body: any) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.assetId) throw new BadRequestException('Asset ID is required');
    return this.service.transformMediaItem(ws, body);
  }

  @Get('r/:code')
  async redirectLink(
    @Param('code') code: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const host = req.headers.host || 'flux.ora';
    const link = await this.service.resolveAndClickLink(host, code);
    if (!link) {
      throw new BadRequestException('Shortened link not found or expired');
    }

    let targetUrl = link.originalUrl;
    const utmParams: string[] = [];
    if (link.utmSource) {
      utmParams.push(`utm_source=${encodeURIComponent(link.utmSource)}`);
    }
    if (link.utmMedium) {
      utmParams.push(`utm_medium=${encodeURIComponent(link.utmMedium)}`);
    }
    if (link.utmCampaign) {
      utmParams.push(`utm_campaign=${encodeURIComponent(link.utmCampaign)}`);
    }

    if (utmParams.length > 0) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}${utmParams.join('&')}`;
    }

    return res.redirect(302, targetUrl);
  }

  @Get('listening/mentions')
  getListeningMentions() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getListeningMentions(ws);
  }

  @Post('listening/sync')
  syncListeningMentions() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.syncMentions(ws);
  }

  @Get('listening/settings')
  getListeningSettings() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getTrackedKeywords(ws);
  }

  @Post('listening/keyword')
  addTrackedKeyword(@Body() body: { keyword: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.keyword) throw new BadRequestException('Keyword is required');
    return this.service.addTrackedKeyword(ws, body.keyword);
  }

  @Delete('listening/keyword')
  removeTrackedKeyword(@Query('keyword') keyword: string) {
    const ws = this.getWorkspaceOrThrow();
    if (!keyword) throw new BadRequestException('Keyword is required');
    return this.service.removeTrackedKeyword(ws, keyword);
  }

  @Get('listening/competitors')
  getCompetitors() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getCompetitors(ws);
  }

  @Get('listening/competitor/details')
  getCompetitorDetails() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getCompetitorDetails(ws);
  }

  @Post('listening/ticket')
  convertMentionToTicket(@Body() body: { mentionId: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.mentionId)
      throw new BadRequestException('Mention ID is required');
    return this.service.convertMentionToTicket(ws, body.mentionId);
  }
}
