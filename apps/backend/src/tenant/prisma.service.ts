import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantService } from './tenant.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly tenantService: TenantService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  // Wrapper method to run operations in the context of the active tenant workspace.
  // Sets the session configuration app.current_workspace_id locally within a transaction block.
  async runInWorkspace<T>(
    callback: (tx: PrismaClient) => Promise<T>,
  ): Promise<T> {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      return callback(this);
    }

    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
      return callback(tx as any);
    });
  }
}
