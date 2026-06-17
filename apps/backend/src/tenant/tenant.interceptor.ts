import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || 'anonymous';

    // Allow status, health, and MCP endpoints without validation
    if (
      request.url.includes('/health') ||
      request.url.includes('/mcp') ||
      request.url === '/'
    ) {
      return next.handle();
    }

    const tenantIdHeader = request.headers['x-tenant-id'];
    const workspaceIdHeader = request.headers['x-workspace-id'];
    const hostHeader = request.headers['host'];

    const isCustomHost =
      hostHeader &&
      !['localhost', '127.0.0.1'].includes(
        hostHeader.split(':')[0].toLowerCase(),
      );

    // If no custom host is used, we validate headers synchronously to maintain compatibility
    if (!isCustomHost && (!tenantIdHeader || !workspaceIdHeader)) {
      throw new BadRequestException(
        'Missing X-Tenant-ID or X-Workspace-ID context header',
      );
    }

    return new Observable((subscriber) => {
      const resolveContext = async () => {
        try {
          let tenantId = tenantIdHeader;
          let workspaceId = workspaceIdHeader;

          if (isCustomHost && (!tenantId || !workspaceId)) {
            const cleanHost = hostHeader.split(':')[0].toLowerCase();
            const workspace = await this.prisma.workspace.findUnique({
              where: { customDomain: cleanHost },
            });
            if (workspace) {
              workspaceId = workspace.id;
              tenantId = workspace.tenantId;
            }
          }

          if (!tenantId || !workspaceId) {
            throw new BadRequestException(
              'Missing X-Tenant-ID or X-Workspace-ID context header',
            );
          }

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
        } catch (err) {
          subscriber.error(err);
        }
      };

      void resolveContext();
    });
  }
}
