import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OpenTelemetryMiddleware implements NestMiddleware {
  private readonly logger = new Logger('OpenTelemetrySDK');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();

    // Simulate generating Trace ID and Span ID for OpenTelemetry context propagation
    const traceId =
      req.headers['x-trace-id'] ||
      `ot-${Math.random().toString(36).substring(2, 18)}`;
    const spanId = `span-${Math.random().toString(36).substring(2, 10)}`;

    res.setHeader('X-Trace-Id', traceId);

    res.on('finish', () => {
      const duration = process.hrtime(startTime);
      const latencyMs = (duration[0] * 1e3 + duration[1] * 1e-6).toFixed(2);

      // Log structured OpenTelemetry format for Loki/Prometheus/Jaeger ingestors
      const otelRecord = {
        traceId,
        spanId,
        serviceName: 'fluxora-backend',
        timestamp: new Date().toISOString(),
        attributes: {
          'http.method': req.method,
          'http.route': req.route?.path || req.url,
          'http.status_code': res.statusCode,
          'http.latency_ms': parseFloat(latencyMs),
          'http.user_agent': req.headers['user-agent'] || 'unknown',
          'http.client_ip': req.ip || req.socket.remoteAddress,
          'tenant.id': req.headers['x-tenant-id'] || 'anonymous',
          'workspace.id': req.headers['x-workspace-id'] || 'anonymous',
        },
      };

      this.logger.log(JSON.stringify(otelRecord));
    });

    next();
  }
}
