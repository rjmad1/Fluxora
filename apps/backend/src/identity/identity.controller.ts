import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { IdentityGraphService } from './identity-graph.service';
import { TenantInterceptor } from '../tenant/tenant.interceptor';
import { TenantService } from '../tenant/tenant.service';

@Controller('api/v1/identity')
@UseInterceptors(TenantInterceptor)
export class IdentityController {
  constructor(
    private readonly identityGraphService: IdentityGraphService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('graph')
  async getGraph() {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return this.identityGraphService.getIdentityGraph(ws);
  }

  @Post('resolve')
  async resolve(
    @Body()
    body: {
      identifiers: Array<{ type: any; value: string }>;
      probabilisticMatches?: Array<{
        type: any;
        value: string;
        confidence: number;
      }>;
    },
  ) {
    const ws = this.tenantService.getWorkspaceId();
    if (!ws) {
      throw new BadRequestException('Missing active workspace context header');
    }
    if (!body.identifiers || !Array.isArray(body.identifiers)) {
      throw new BadRequestException('Missing or invalid field: identifiers');
    }
    return this.identityGraphService.resolveProfile(
      ws,
      body.identifiers,
      body.probabilisticMatches ?? [],
    );
  }
}
