import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Client } from '@temporalio/client';

@Injectable()
export class TemporalService implements OnModuleInit {
  private readonly logger = new Logger(TemporalService.name);
  private client: Client | null = null;
  private isTemporalActive = false;
  private address = 'localhost:7233';
  private namespace = 'default';

  constructor(private readonly configService: ConfigService) {
    this.address = this.configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233');
    this.namespace = this.configService.get<string>('TEMPORAL_NAMESPACE', 'default');
  }

  async onModuleInit() {
    try {
      this.logger.log(`Connecting to Temporal Server at ${this.address}...`);
      const connection = await Connection.connect({ address: this.address });
      this.client = new Client({ connection, namespace: this.namespace });
      
      // Verify connection by making a lightweight gRPC call
      await connection.ensureConnected();
      
      this.isTemporalActive = true;
      this.logger.log('Successfully connected to Temporal Server. Temporal workflows active.');
    } catch (err: any) {
      this.isTemporalActive = false;
      this.client = null;
      this.logger.warn(
        `Temporal Server unreachable at ${this.address}. Operating in BullMQ scheduling fallback mode: ${err.message}`,
      );
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  getIsTemporalActive(): boolean {
    return this.isTemporalActive;
  }
}
