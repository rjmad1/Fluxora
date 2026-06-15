import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../tenant/prisma.service';

@Injectable()
export class TransactionalOutboxInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionalOutboxInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    const tenantId = headers['x-tenant-id'] || 'anonymous';
    const workspaceId = headers['x-workspace-id'] || 'anonymous';

    // We only audit mutating operations
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    if (!isMutation || url.includes('/health') || url === '/') {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.handleAuditSuccess(
            data,
            method,
            url,
            tenantId as string,
            workspaceId as string,
          );
        },
        error: (err) => {
          this.logger.warn(
            `Mutation request failed. Skipping outbox emission: ${err.message}`,
          );
        },
      }),
    );
  }

  private handleAuditSuccess(
    data: any,
    method: string,
    url: string,
    tenantId: string,
    workspaceId: string,
  ) {
    let auditAction = 'unknown';
    if (url.includes('/posts')) {
      auditAction = url.includes('/approval')
        ? 'post.approval_processed'
        : 'post.scheduled';
    } else if (url.includes('/accounts')) {
      auditAction = 'connected_account.onboarded';
    }

    this.logger.log(
      `Outbox Pattern: Persisting audit record to database outbox table...`,
    );

    this.prisma.auditOutbox
      .create({
        data: {
          action: auditAction,
          tenantId,
          workspaceId,
          resourceId: (data && data.id) || 'unknown',
          method,
          url,
          timestamp: new Date(),
          processed: true, // Mark processed immediately since it is saved locally
        },
      })
      .then(() => {
        this.logger.log(
          `Outbox Pattern: Saved audit record to database outbox table successfully.`,
        );
      })
      .catch((error: Error) => {
        this.logger.error(
          `Outbox Pattern: Failed to save audit record to database outbox: ${error.message}`,
        );
      });
  }
}
