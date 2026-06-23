import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { VaultService } from '../secrets/vault.service';
import { SocialAdaptersService } from './adapters.service';
import { KafkaService } from '../observability/kafka.service';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PublishActivities {
  private readonly logger = new Logger(PublishActivities.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
    private readonly socialAdapters: SocialAdaptersService,
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
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
      let tokens: { accessToken: string; expiresAt?: string };
      try {
        tokens = await this.vaultService.getAccountTokens(account.id);
        const isExpired =
          tokens.expiresAt && new Date(tokens.expiresAt).getTime() < Date.now();
        if (!tokens.accessToken || isExpired) {
          throw new Error(
            tokens.accessToken ? 'Token has expired' : 'Token is empty',
          );
        }
      } catch (error: any) {
        this.logger.error(
          `Decrypted credentials failed for account ${account.id}: ${error.message}. Shifting post to Pending_HITL review.`,
        );

        // Update database with Pending_HITL status to pause execution branch gracefully
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            status: 'Pending_HITL',
            feedback: `Credentials validation failed on platform ${variant.platform}: ${error.message}`,
          },
        });

        // Trigger post.failed webhook to notify external automations
        try {
          void this.notificationsService.dispatchWebhook(
            post.workspaceId,
            'post.failed',
            {
              postId,
              platform: variant.platform,
              error: `Credentials validation failed: ${error.message}. Shifted to Pending_HITL.`,
            },
          );
        } catch (whErr: any) {
          this.logger.error(
            `Webhook post.failed dispatch failed: ${whErr.message}`,
          );
        }

        throw new Error(
          `Token validation failed for ${variant.platform}. Post shifted to Pending_HITL review.`,
        );
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
        this.logger.error(
          `Telemetry Kafka publish failed: ${kafkaError.message}`,
        );
      }

      try {
        // 4. Execute publication via SocialAdapter
        await this.socialAdapters.publishToPlatform(
          variant.platform,
          content,
          mediaUrls,
          tokens.accessToken,
          post.workspaceId,
        );

        publishedCount++;

        // 5. Persist Telemetry: post.dispatched
        try {
          await this.kafkaService.emitEvent(
            'fluxora.telemetry.events',
            postId,
            {
              id: crypto.randomUUID(),
              workspaceId: post.workspaceId,
              postId,
              platform: variant.platform.toLowerCase(),
              eventType: 'post.dispatched',
              timestamp: new Date().toISOString(),
            },
          );
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

        // Trigger post.failed webhook
        try {
          void this.notificationsService.dispatchWebhook(
            post.workspaceId,
            'post.failed',
            {
              postId,
              platform: variant.platform,
              error: publishError.message,
            },
          );
        } catch (whErr: any) {
          this.logger.error(
            `Webhook post.failed dispatch failed: ${whErr.message}`,
          );
        }

        throw publishError; // Rethrow to let queue retry
      }
    }

    // 6. Update main Post status in PostgreSQL
    await this.prisma.post.update({
      where: { id: postId },
      data: { status: 'Published' },
    });

    // Trigger post.published webhook
    try {
      void this.notificationsService.dispatchWebhook(
        post.workspaceId,
        'post.published',
        {
          postId,
          status: 'Published',
          publishedCount,
        },
      );
    } catch (whErr: any) {
      this.logger.error(
        `Webhook post.published dispatch failed: ${whErr.message}`,
      );
    }

    this.logger.log(`Post ${postId} fully published across platforms!`);
    return { success: true, publishedCount };
  }
}
