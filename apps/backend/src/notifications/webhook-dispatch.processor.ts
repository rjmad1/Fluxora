import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../tenant/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface WebhookDispatchData {
  subscriptionId: string;
  workspaceId: string;
  eventType: string;
  payload: any;
}

@Processor('webhook-delivery')
export class WebhookDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDispatchProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<WebhookDispatchData, any, string>): Promise<any> {
    const { subscriptionId, workspaceId, eventType, payload } = job.data;
    this.logger.log(
      `Processing webhook dispatch job ${job.id} for event ${eventType} (Sub: ${subscriptionId})`,
    );

    // 1. Fetch subscription details (under workspace context)
    const sub = await this.prisma.runInWorkspace(async (tx) => {
      return tx.webhookSubscription.findFirst({
        where: { id: subscriptionId, workspaceId },
      });
    });

    if (!sub || !sub.active) {
      this.logger.warn(
        `Webhook subscription ${subscriptionId} not found or inactive. Skipping.`,
      );
      return { skipped: true, reason: 'subscription_inactive_or_missing' };
    }

    const payloadString = JSON.stringify(payload);

    // 2. Generate HMAC-SHA256 signature
    const secret = sub.secret || 'fluxora_sec_default';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const signature = hmac.digest('hex');

    const startTime = Date.now();
    let statusCode: number | null = null;
    let responseText: string | null = null;

    // 3. Dispatch POST request
    try {
      const res = await axios.post(
        sub.url,
        {
          event: eventType,
          workspaceId,
          timestamp: new Date().toISOString(),
          payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Fluxora-Signature': signature,
          },
          timeout: 4000,
        },
      );
      statusCode = res.status;
      responseText =
        typeof res.data === 'object'
          ? JSON.stringify(res.data)
          : String(res.data);
      this.logger.log(
        `Webhook successfully dispatched to ${sub.url} with status ${statusCode}`,
      );
    } catch (err: any) {
      statusCode = err.response?.status || 500;
      responseText = err.response?.data
        ? typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : String(err.response.data)
        : err.message;
      this.logger.error(
        `Webhook dispatch to ${sub.url} failed: ${err.message}`,
      );
    } finally {
      const durationMs = Date.now() - startTime;

      // 4. Log the result in WebhookDeliveryLog
      try {
        await this.prisma.runInWorkspace(async (tx) => {
          return tx.webhookDeliveryLog.create({
            data: {
              workspaceId,
              webhookId: subscriptionId,
              url: sub.url,
              eventType,
              payload: payloadString,
              statusCode,
              response: responseText ? responseText.substring(0, 1000) : null,
              durationMs,
            },
          });
        });
      } catch (logErr: any) {
        this.logger.error(
          `Failed to write webhook delivery log to DB: ${logErr.message}`,
        );
      }
    }

    return { success: statusCode === 200 || statusCode === 201, statusCode };
  }
}
