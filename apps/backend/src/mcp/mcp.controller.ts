import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { McpService } from './mcp.service';
import { TenantService } from '../tenant/tenant.service';
import { Roles } from 'nest-keycloak-connect';

@Controller('api/v1/mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(
    private readonly mcpService: McpService,
    private readonly tenantService: TenantService,
  ) {}

  @Post()
  @Roles({ roles: ['admin', 'developer'] })
  async handleMcpRequest(
    @Body() body: any,
    @Headers('x-tenant-id') tenantIdHeader?: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const tenantId = tenantIdHeader || 'tenant-1';
    const workspaceId = workspaceIdHeader || 'ws-1';

    this.logger.log(
      `MCP request received. Bound context: Workspace=${workspaceId}, Tenant=${tenantId}`,
    );

    return this.tenantService.runWithContext(
      {
        tenantId,
        workspaceId,
        userId: 'mcp-cli-session',
      },
      () => this.mcpService.handleJsonRpc(body, workspaceId),
    );
  }
}
