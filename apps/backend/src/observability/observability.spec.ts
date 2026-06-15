import { Test, TestingModule } from '@nestjs/testing';
import { OpenTelemetryMiddleware } from './otel.middleware';
import { TransactionalOutboxInterceptor } from './outbox.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { Request, Response } from 'express';

describe('Observability & Transactional Outbox', () => {
  let otelMiddleware: OpenTelemetryMiddleware;
  let outboxInterceptor: TransactionalOutboxInterceptor;

  // Mock Kafka Producer
  const mockKafkaProducer = {
    send: jest.fn().mockResolvedValue([{ topic: 'fluxora.audit.log' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenTelemetryMiddleware,
        TransactionalOutboxInterceptor,
        {
          provide: 'KAFKA_PRODUCER',
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    otelMiddleware = module.get<OpenTelemetryMiddleware>(
      OpenTelemetryMiddleware,
    );
    outboxInterceptor = module.get<TransactionalOutboxInterceptor>(
      TransactionalOutboxInterceptor,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OpenTelemetryMiddleware', () => {
    it('should inject X-Trace-Id header and register response listener', () => {
      const mockReq = {
        headers: {},
        method: 'GET',
        url: '/api/v1/posts',
      } as Partial<Request>;

      const headers = new Map<string, any>();
      const mockRes = {
        setHeader: jest.fn((k, v) => headers.set(k, v)),
        on: jest.fn(),
      } as unknown as Partial<Response>;

      const mockNext = jest.fn();

      otelMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Trace-Id',
        expect.any(String),
      );
      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('TransactionalOutboxInterceptor', () => {
    it('should bypass non-mutating requests (GET)', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/api/v1/posts',
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      const mockNext = {
        handle: jest.fn().mockReturnValue(of({ success: true })),
      } as unknown as CallHandler;

      outboxInterceptor.intercept(mockContext, mockNext).subscribe({
        next: (val) => {
          expect(val).toEqual({ success: true });
          expect(mockKafkaProducer.send).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should intercept POST mutation and publish audit log to Kafka', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/api/v1/posts',
            headers: {
              'x-tenant-id': 'tenant-999',
              'x-workspace-id': 'workspace-999',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const mockNext = {
        handle: jest
          .fn()
          .mockReturnValue(of({ id: 'post-new-999', status: 'Scheduled' })),
      } as unknown as CallHandler;

      outboxInterceptor.intercept(mockContext, mockNext).subscribe({
        next: (val) => {
          expect(val).toEqual({ id: 'post-new-999', status: 'Scheduled' });

          // Verify Kafka producer sent outbox audit log
          setTimeout(() => {
            expect(mockKafkaProducer.send).toHaveBeenCalledWith(
              expect.objectContaining({
                topic: 'fluxora.audit.log',
              }),
            );
            done();
          }, 50);
        },
      });
    });
  });
});
