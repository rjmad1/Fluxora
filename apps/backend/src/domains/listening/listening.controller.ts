import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TenantService } from '../../tenant/tenant.service';
import { ListeningService } from './listening.service';

@Controller('api/v1/listening')
export class ListeningController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly service: ListeningService,
  ) {}

  private getWorkspaceOrThrow(): string {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return workspaceId;
  }

  @Get('mentions')
  getMentions() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getMentions(ws);
  }

  @Get('settings')
  getListeningSettings() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getOrCreateSettings(ws);
  }

  @Post('keyword')
  addKeyword(@Body() body: { keyword: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.keyword) throw new BadRequestException('Keyword is required');
    return this.service.addTrackedKeyword(ws, body.keyword);
  }

  @Delete('keyword')
  removeKeyword(@Query('keyword') keyword: string) {
    const ws = this.getWorkspaceOrThrow();
    if (!keyword) {
      throw new BadRequestException('Keyword parameter is required');
    }
    return this.service.removeTrackedKeyword(ws, keyword);
  }

  @Post('ticket')
  convertToTicket(@Body() body: { mentionId: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.mentionId) {
      throw new BadRequestException('Mention ID is required');
    }
    return this.service.convertMentionToTicket(ws, body.mentionId);
  }

  @Get('competitors')
  getCompetitors() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getCompetitors(ws);
  }

  @Get('trends')
  getTrendingTopics() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getTrendingTopics(ws);
  }

  @Post('trends/predict')
  predictVirality(@Body() body: { content: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.content) throw new BadRequestException('Content is required');
    return this.service.getViralityPrediction(ws, body.content);
  }

  @Get('competitor/details')
  getCompetitorDetails() {
    const ws = this.getWorkspaceOrThrow();
    return this.service.getCompetitorDetails(ws);
  }

  @Post('competitor/setup')
  setupCompetitor(
    @Body()
    body: {
      name: string;
      handle: string;
      followers?: number;
      engagementRate?: number;
      shareOfVoice?: number;
    },
  ) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.handle) {
      throw new BadRequestException('Competitor handle is required');
    }
    return this.service.setupCompetitor(ws, body);
  }
}
