import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Producer } from 'kafkajs';

@Injectable()
export class TransactionalOutboxInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionalOutboxInterceptor.name);

  constructor(
    @Inject('KAFKA_PRODUCER') private readonly kafkaProducer: Producer,
  ) {}

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

    const auditRecord = {
      eventId: `aud-${Math.random().toString(36).substring(2, 11)}`,
      action: auditAction,
      tenantId,
      workspaceId,
      resourceId: (data && data.id) || 'unknown',
      method,
      url,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
    };

    this.logger.log(
      `Outbox Pattern: Persisting audit record to database outbox table...`,
    );

    this.kafkaProducer
      .send({
        topic: 'fluxora.audit.log',
        messages: [
          {
            key: (data && data.id) || 'unknown',
            value: JSON.stringify(auditRecord),
          },
        ],
      })
      .then(() => {
        this.logger.log(
          `Outbox Pattern: Streamed audit event to Kafka topic fluxora.audit.log`,
        );
      })
      .catch((error: Error) => {
        this.logger.error(
          `Outbox Pattern: Failed to stream audit event to Kafka: ${error.message}`,
        );
      });
  }
}
