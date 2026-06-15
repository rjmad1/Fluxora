import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { VaultService } from '../secrets/vault.service';
import { SocialAdaptersService } from './adapters.service';
import { KafkaService } from '../observability/kafka.service';
import * as crypto from 'crypto';

@Injectable()
export class PublishActivities {
  private readonly logger = new Logger(PublishActivities.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
    private readonly socialAdapters: SocialAdaptersService,
    private readonly kafkaService: KafkaService,
  ) {}

  async publishPostVariantsActivity(
    postId: string,
  ): Promise<{ success: boolean; publishedCount: number }> {
    this.logger.log(
      `Queue activity starting: executing publication for post ${postId}`,
    );

    // 1. Fetch Post and its Variants from the DB
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { variants: true, workspace: true },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found in database`);
    }

    if (post.variants.length === 0) {
      this.logger.warn(`Post ${postId} has no variants. Marking published.`);
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'Published' },
      });
      return { success: true, publishedCount: 0 };
    }

    // 2. Fetch ConnectedAccounts linked to this workspace
    const accounts = await this.prisma.connectedAccount.findMany({
      where: {
        workspaceId: post.workspaceId,
        status: 'ACTIVE',
      },
    });

    let publishedCount = 0;

    for (const variant of post.variants) {
      const account = accounts.find(
        (acc) => acc.provider.toLowerCase() === variant.platform.toLowerCase(),
      );

      if (!account) {
        this.logger.warn(
          `No active connected account found for platform ${variant.platform} in workspace ${post.workspaceId}. Skipping variant.`,
        );
        continue;
      }

      // Fetch credentials from Local Vault Service (encrypted database)
      let tokens: { accessToken: string };
      try {
        tokens = await this.vaultService.getAccountTokens(account.id);
      } catch (error) {
        this.logger.error(
          `Failed to retrieve decrypted credentials for account ${account.id}: ${error.message}`,
        );
        continue;
      }

      // Prepare variant content (falls back to main post content if override is null)
      const content = variant.overrideContent || post.content;
      const mediaUrls = variant.assetUrls;

      // 3. Persist Telemetry: post.publishing
      try {
        await this.kafkaService.emitEvent('fluxora.telemetry.events', postId, {
          id: crypto.randomUUID(),
          workspaceId: post.workspaceId,
          postId,
          platform: variant.platform.toLowerCase(),
          eventType: 'post.publishing',
          timestamp: new Date().toISOString(),
        });
      } catch (kafkaError) {
        this.logger.error(`Telemetry Kafka publish failed: ${kafkaError.message}`);
      }

      try {
        // 4. Execute publication via SocialAdapter
        const publishResult = await this.socialAdapters.publishToPlatform(
          variant.platform,
          content,
          mediaUrls,
          tokens.accessToken,
        );

        publishedCount++;

        // 5. Persist Telemetry: post.dispatched
        try {
          await this.kafkaService.emitEvent('fluxora.telemetry.events', postId, {
            id: crypto.randomUUID(),
            workspaceId: post.workspaceId,
            postId,
            platform: variant.platform.toLowerCase(),
            eventType: 'post.dispatched',
            timestamp: new Date().toISOString(),
          });
        } catch (kafkaError) {
          this.logger.error(
            `Telemetry dispatch Kafka event publish failed: ${kafkaError.message}`,
          );
        }
      } catch (publishError) {
        this.logger.error(
          `Platform publish failed for ${variant.platform}: ${publishError.message}`,
        );

        // Update database with failed status for this post variant, and rethrow to trigger queue retry
        await this.prisma.post.update({
          where: { id: postId },
          data: { status: 'Failed' },
        });

        throw publishError; // Rethrow to let queue retry
      }
    }

    // 6. Update main Post status in PostgreSQL
    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'Published' },
    });

    this.logger.log(`Post ${postId} fully published across platforms!`);
    return { success: true, publishedCount };
  }
}
