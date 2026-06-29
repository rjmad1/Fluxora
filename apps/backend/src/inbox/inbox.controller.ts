import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Post,
  Body,
} from '@nestjs/common';
import { InboxService } from './inbox.service';
import { TenantService } from '../tenant/tenant.service';
import * as crypto from 'crypto';

@Controller('api/v1/inbox')
export class InboxController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('conversations')
  getConversations() {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId)
      throw new BadRequestException('Missing active workspace context header');

    return this.inboxService.getConversations(workspaceId);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') conversationId: string) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId)
      throw new BadRequestException('Missing active workspace context header');

    return this.inboxService.getMessagesForConversation(
      workspaceId,
      conversationId,
    );
  }

  @Post('conversations/:id/reply')
  async replyToConversation(
    @Param('id') conversationId: string,
    @Body() body: { text: string; platform: string },
  ) {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId)
      throw new BadRequestException('Missing active workspace context header');
    if (!body.text) throw new BadRequestException('Text is required');

    const message = await this.inboxService.addMessage({
      workspaceId,
      conversationId,
      platform: body.platform || 'unknown',
      senderName: 'Fluxora System',
      senderAvatar: null,
      text: body.text,
      isOutbound: true,
    });

    // In a real system, we would also push this out via the specific platform's API

    return message;
  }
}
