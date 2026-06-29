import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { PersonalContextEngineService } from './personal-context-engine.service';
import { TenantInterceptor } from '../tenant/tenant.interceptor';
import { TenantService } from '../tenant/tenant.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { FactoryService } from './factory.service';

@Controller('api/v1/ai')
@UseInterceptors(TenantInterceptor)
export class AIController {
  constructor(
    private readonly contextEngine: PersonalContextEngineService,
    private readonly tenantService: TenantService,
    private readonly orchestrator: AgentOrchestratorService,
    private readonly memoryService: OrganizationalMemoryService,
    private readonly factoryService: FactoryService,
  ) {}

  @Post('generate')
  async generatePersonalizedPost(
    @Body('prompt') prompt: string,
    @Body('tone') tone?: string,
    @Body('hashtags') hashtags?: string[],
  ) {
    if (!prompt || !prompt.trim()) {
      throw new BadRequestException('Missing required field: prompt');
    }
    return this.contextEngine.generateContent(prompt, tone, hashtags);
  }

  @Post('refine')
  async refinePost(
    @Body('content') content: string,
    @Body('action') action: string,
  ) {
    if (!content || !action) {
      throw new BadRequestException('Missing required fields: content, action');
    }
    const refined = await this.contextEngine.refineContent(content, action);
    return { content: refined };
  }

  @Get('runs')
  async getRuns() {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return this.orchestrator.getRuns(ws);
  }

  @Get('runs/approvals')
  async getApprovals() {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return this.orchestrator.getApprovals(ws);
  }

  @Post('runs/start')
  async startRun(@Body() body: { goal: string; maxBudget?: number }) {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    if (!body.goal || !body.goal.trim()) {
      throw new BadRequestException('Missing required field: goal');
    }
    return this.orchestrator.startGrowthLoop(
      ws,
      body.goal,
      body.maxBudget ?? 500,
    );
  }

  @Post('runs/approve')
  async approveRun(
    @Body() body: { approvalId: string; status: 'APPROVED' | 'REJECTED' },
  ) {
    if (!body.approvalId || !body.status) {
      throw new BadRequestException(
        'Missing required fields: approvalId, status',
      );
    }
    return this.orchestrator.submitApproval(body.approvalId, body.status);
  }

  @Get('memory/search')
  async searchMemory(
    @Query('query') query: string,
    @Query('category') category: string,
    @Query('limit') limit?: string,
  ) {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    if (!query || !query.trim()) {
      throw new BadRequestException('Missing required query parameter: query');
    }
    return this.memoryService.searchMemories(
      ws,
      query,
      category as any,
      limit ? Number(limit) : 5,
    );
  }

  @Post('factory/execute')
  async executeFactory(@Body('reportId') reportId: string) {
    const ws = this.tenantService.getWorkspaceId() || 'workspace-default-dev';
    if (!reportId) {
      throw new BadRequestException('Missing required field: reportId');
    }
    return this.factoryService.runAIImplementationFactory(reportId, ws);
  }
}
