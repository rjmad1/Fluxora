import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InboxService } from './inbox.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/inbox',
})
export class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InboxGateway.name);

  constructor(private readonly inboxService: InboxService) {
    // Subscribe to new messages from the service and emit them to connected clients
    this.inboxService.messageStream$.subscribe((message) => {
      this.logger.log(
        `Broadcasting new message for workspace ${message.workspaceId}`,
      );
      // Broadcast to room corresponding to workspaceId
      this.server
        .to(`workspace_${message.workspaceId}`)
        .emit('newMessage', message);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Inbox WS: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Inbox WS: ${client.id}`);
  }

  @SubscribeMessage('joinWorkspace')
  handleJoinWorkspace(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (workspaceId) {
      client.join(`workspace_${workspaceId}`);
      this.logger.log(`Client ${client.id} joined workspace_${workspaceId}`);
      return { status: 'joined', workspaceId };
    }
  }
}
