import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { InboxService, InboxMessage } from './inbox.service';
import { KafkaService } from '../observability/kafka.service';
import * as crypto from 'crypto';

@Controller('api/v1/webhooks/inbox')
export class WebhookController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly kafkaService: KafkaService,
  ) {}

  @Post()
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Headers('x-platform') platform: string,
  ) {
    if (!workspaceId)
      throw new BadRequestException(
        'x-workspace-id header is required for webhooks',
      );
    if (!platform)
      throw new BadRequestException('x-platform header is required');

    // Simulate standardizing the payload
    const message: InboxMessage = {
      id: crypto.randomUUID(),
      workspaceId,
      conversationId:
        payload.conversationId || `conv-${crypto.randomUUID().substring(0, 8)}`,
      platform: platform.toLowerCase(),
      senderName: payload.senderName || 'Anonymous User',
      senderAvatar: payload.senderAvatar,
      text: payload.text || '',
      timestamp: new Date(),
      isOutbound: false,
    };

    // Store it in the local memory for the inbox
    this.inboxService.addMessage(message);

    // Emit telemetry event via Kafka
    await this.kafkaService.emitEvent(
      'fluxora.telemetry.events',
      message.conversationId,
      {
        id: crypto.randomUUID(),
        workspaceId,
        postId: message.conversationId, // Using conversationId as context here
        platform: message.platform,
        eventType: 'inbox.message_received',
        timestamp: message.timestamp,
      },
    );

    return { status: 'ok' };
  }
}
