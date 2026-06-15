import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantService: TenantService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    const workspaceId = request.headers['x-workspace-id'];
    const userId = request.user?.sub || 'anonymous';

    // Allow status and health endpoints without validation
    if (request.url.includes('/health') || request.url === '/') {
      return next.handle();
    }

    if (!tenantId || !workspaceId) {
      throw new BadRequestException(
        'Missing X-Tenant-ID or X-Workspace-ID context header',
      );
    }

    return new Observable((subscriber) => {
      this.tenantService.runWithContext(
        {
          tenantId: tenantId as string,
          workspaceId: workspaceId as string,
          userId: userId as string,
        },
        () => {
          next.handle().subscribe({
            next: (val) => subscriber.next(val),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }
}
