import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../tenant/prisma.service';
import { InboxMessage as PrismaInboxMessage } from '@prisma/client';

export type InboxMessage = PrismaInboxMessage;

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  // RxJS subject to notify the gateway of new messages
  public messageStream$ = new Subject<InboxMessage>();

  constructor(private readonly prisma: PrismaService) {}

  async getConversations(workspaceId: string) {
    const messages = await this.prisma.inboxMessage.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
    });

    // Group by conversationId to get latest message per conversation
    const conversations = new Map<string, any>();

    messages.forEach((msg) => {
      if (!conversations.has(msg.conversationId)) {
        conversations.set(msg.conversationId, {
          id: msg.conversationId,
          platform: msg.platform,
          participantName: msg.isOutbound ? 'Customer' : msg.senderName, // Simplified logic
          participantAvatar: msg.isOutbound ? undefined : msg.senderAvatar,
          latestMessage: msg,
          unreadCount: 0, // Mock unread count
        });
      }
    });

    return Array.from(conversations.values());
  }

  async getMessagesForConversation(
    workspaceId: string,
    conversationId: string,
  ) {
    return this.prisma.inboxMessage.findMany({
      where: { workspaceId, conversationId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async addMessage(data: Omit<InboxMessage, 'id' | 'timestamp'>) {
    const message = await this.prisma.inboxMessage.create({
      data: {
        ...data,
      },
    });

    // Notify connected clients
    this.messageStream$.next(message);
    this.logger.log(
      `New message added to conversation ${message.conversationId}`,
    );
    return message;
  }
}
