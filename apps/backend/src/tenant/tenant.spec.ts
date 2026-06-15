import { Test, TestingModule } from '@nestjs/testing';
import { TenantService, TenantContext } from './tenant.service';
import { TenantInterceptor } from './tenant.interceptor';
import { PrismaService } from './prisma.service';
import {
  ExecutionContext,
  BadRequestException,
  CallHandler,
} from '@nestjs/common';
import { of } from 'rxjs';

describe('Tenant Management & Isolation', () => {
  let tenantService: TenantService;
  let prismaService: PrismaService;
  let tenantInterceptor: TenantInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        TenantInterceptor,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb) =>
              cb({
                $executeRawUnsafe: jest.fn().mockResolvedValue(1),
                $executeRaw: jest.fn().mockResolvedValue(1),
              }),
            ),
            $executeRawUnsafe: jest.fn().mockResolvedValue(1),
            $executeRaw: jest.fn().mockResolvedValue(1),
            tenantService: null,
            runInWorkspace: PrismaService.prototype.runInWorkspace,
          },
        },
      ],
    }).compile();

    tenantService = module.get<TenantService>(TenantService);
    prismaService = module.get<PrismaService>(PrismaService);
    tenantInterceptor = module.get<TenantInterceptor>(TenantInterceptor);
    // Bind tenantService manually to the mocked prismaService
    (prismaService as any).tenantService = tenantService;
  });

  describe('TenantService', () => {
    it('should run a callback within TenantContext and retrieve it', () => {
      const context: TenantContext = {
        tenantId: 'tenant-123',
        workspaceId: 'workspace-456',
        userId: 'user-789',
      };

      tenantService.runWithContext(context, () => {
        expect(tenantService.getContext()).toEqual(context);
        expect(tenantService.getTenantId()).toBe('tenant-123');
        expect(tenantService.getWorkspaceId()).toBe('workspace-456');
        expect(tenantService.getUserId()).toBe('user-789');
      });

      expect(tenantService.getContext()).toBeUndefined();
    });
  });

  describe('TenantInterceptor', () => {
    let mockContext: Partial<ExecutionContext>;
    let mockNext: Partial<CallHandler>;

    beforeEach(() => {
      mockNext = {
        handle: jest.fn().mockReturnValue(of({ success: true })),
      };
    });

    it('should allow health check endpoint without tenant context', (done) => {
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/health',
            headers: {},
          }),
          getResponse: jest.fn() as any,
          getNext: jest.fn() as any,
        }),
      };

      tenantInterceptor
        .intercept(mockContext as ExecutionContext, mockNext as CallHandler)
        .subscribe({
          next: (val) => {
            try {
              expect(val).toEqual({ success: true });
              expect(tenantService.getContext()).toBeUndefined();
              done();
            } catch (e) {
              done(e);
            }
          },
          error: (err) => done(err),
        });
    });

    it('should throw BadRequestException if X-Tenant-ID is missing', () => {
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/posts',
            headers: {
              'x-workspace-id': 'workspace-123',
            },
          }),
          getResponse: jest.fn() as any,
          getNext: jest.fn() as any,
        }),
      };

      expect(() => {
        tenantInterceptor.intercept(
          mockContext as ExecutionContext,
          mockNext as CallHandler,
        );
      }).toThrow(BadRequestException);
    });

    it('should propagate headers to TenantContext during request execution', (done) => {
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/posts',
            headers: {
              'x-tenant-id': 'tenant-abc',
              'x-workspace-id': 'workspace-def',
            },
            user: { sub: 'user-xyz' },
          }),
          getResponse: jest.fn() as any,
          getNext: jest.fn() as any,
        }),
      };

      let insideContext: TenantContext | undefined;
      const handleSpy = jest
        .spyOn(mockNext, 'handle')
        .mockImplementation(() => {
          insideContext = tenantService.getContext();
          return of({ data: [] });
        });

      tenantInterceptor
        .intercept(mockContext as ExecutionContext, mockNext as CallHandler)
        .subscribe({
          next: (val) => {
            try {
              expect(val).toEqual({ data: [] });
              expect(handleSpy).toHaveBeenCalled();
              expect(insideContext).toEqual({
                tenantId: 'tenant-abc',
                workspaceId: 'workspace-def',
                userId: 'user-xyz',
              });
              done();
            } catch (e) {
              done(e);
            }
          },
          error: (err) => {
            done(err);
          },
        });

      expect(tenantService.getContext()).toBeUndefined();
    });
  });

  describe('PrismaService Row-Level Security', () => {
    it('should set LOCAL app.current_workspace_id within transaction', async () => {
      const context: TenantContext = {
        tenantId: 'tenant-abc',
        workspaceId: 'workspace-def',
        userId: 'user-xyz',
      };

      const result = await tenantService.runWithContext(context, async () => {
        return prismaService.runInWorkspace(async (_tx) => {
          return { done: true };
        });
      });

      expect(result).toEqual({ done: true });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should bypass transaction if workspaceId is not in context', async () => {
      const result = await prismaService.runInWorkspace(async (_tx) => {
        return { bypassed: true };
      });

      expect(result).toEqual({ bypassed: true });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});
