import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  workspaceId: string;
  userId: string;
}

@Injectable()
export class TenantService {
  private static readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  runWithContext(context: TenantContext, callback: () => any): any {
    return TenantService.asyncLocalStorage.run(context, callback);
  }

  getContext(): TenantContext | undefined {
    return TenantService.asyncLocalStorage.getStore();
  }

  getWorkspaceId(): string | undefined {
    return this.getContext()?.workspaceId;
  }

  getTenantId(): string | undefined {
    return this.getContext()?.tenantId;
  }

  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }
}
