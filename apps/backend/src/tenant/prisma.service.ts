import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantService } from './tenant.service';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private static createPrismaOptions(configService: ConfigService) {
    const dbUrl = configService.get<string>('DATABASE_URL');
    console.log('PRISMA_SERVICE_DATABASE_URL:', dbUrl);

    let connectionString = dbUrl;
    if (dbUrl && dbUrl.startsWith('prisma+postgres://')) {
      const urlObj = new URL(dbUrl);
      const apiKeyEncoded = urlObj.searchParams.get('api_key');
      if (apiKeyEncoded) {
        try {
          const payloadJson = Buffer.from(apiKeyEncoded, 'base64').toString(
            'utf-8',
          );
          const payload = JSON.parse(payloadJson);
          if (payload && payload.databaseUrl) {
            connectionString = payload.databaseUrl;
            console.log('EXTRACTED_DIRECT_DATABASE_URL:', connectionString);
          }
        } catch (e) {
          console.error('Failed to parse api_key payload:', e);
        }
      }
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return { adapter };
  }

  constructor(
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
  ) {
    super(PrismaService.createPrismaOptions(configService));
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
