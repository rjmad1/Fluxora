import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FeedbackService, CreateFeedbackDto } from './feedback.service';
import { TenantService } from '../tenant/tenant.service';

@Controller('api/v1/feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('submit')
  async submitFeedback(@Body() dto: CreateFeedbackDto) {
    const workspaceId =
      this.tenantService.getWorkspaceId() || 'workspace-default-dev';
    if (!dto.title || !dto.description || !dto.type) {
      throw new BadRequestException(
        'Missing required fields: title, description, type',
      );
    }
    return this.feedbackService.createFeedback(dto, workspaceId);
  }

  @Get('list')
  async listFeedback() {
    const workspaceId =
      this.tenantService.getWorkspaceId() || 'workspace-default-dev';
    return this.feedbackService.getFeedbackReports(workspaceId);
  }
}
