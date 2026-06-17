import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { TenantInterceptor } from '../tenant/tenant.interceptor';
import { TenantService } from '../tenant/tenant.service';
import { TwinPipelineService } from './twin-pipeline.service';

@Controller('api/v1/twin')
@UseInterceptors(TenantInterceptor)
export class TwinController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly twinPipelineService: TwinPipelineService,
  ) {}

  @Get('topics')
  async getTopics() {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return this.twinPipelineService.getPendingTopics(ws);
  }

  @Post('topics/trigger-research')
  async triggerResearch() {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return this.twinPipelineService.triggerAutonomousResearch(ws);
  }

  @Post('topics/:id/generate')
  async generateVariants(@Param('id') topicId: string) {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    if (!topicId) {
      throw new BadRequestException('Missing required parameter: id');
    }
    return this.twinPipelineService.generateTopicVariants(ws, topicId);
  }
}
