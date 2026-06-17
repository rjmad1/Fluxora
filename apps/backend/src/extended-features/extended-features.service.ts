import { Injectable, Logger } from '@nestjs/common';
import {
  ExtendedFeaturesRepository,
  PostTemplate,
  LeaderboardEntry,
  ABTest,
  ShortenedLink,
  AuditLog,
  WorkspaceSettings,
  InboxMessage,
  TaxonomyTag,
  AutoCollection,
  TopicWeight,
  MediaStudioItem,
} from './extended-features.repository';

@Injectable()
export class ExtendedFeaturesService {
  private readonly logger = new Logger(ExtendedFeaturesService.name);

  constructor(private readonly repository: ExtendedFeaturesRepository) {}

  // --- EMPLOYEE ADVOCACY ---
  async getTemplates(workspaceId: string): Promise<PostTemplate[]> {
    return this.repository.getTemplates(workspaceId);
  }

  async shareTemplate(
    workspaceId: string,
    templateId: string,
  ): Promise<{ success: boolean; sharedCount: number }> {
    const updated = await this.repository.shareTemplate(
      workspaceId,
      templateId,
    );
    await this.logAction(
      workspaceId,
      'employee@fluxora.com',
      `advocacy.share_template (Template ID: ${templateId})`,
      'SUCCESS',
    );
    return { success: true, sharedCount: updated.sharedCount };
  }

  async getLeaderboard(workspaceId: string): Promise<LeaderboardEntry[]> {
    return this.repository.getLeaderboard(workspaceId);
  }

  async saveEmailDigestConfig(
    workspaceId: string,
    config: any,
  ): Promise<WorkspaceSettings> {
    const settings = await this.repository.updateSettings(workspaceId, {
      emailDigest: config,
    });
    await this.logAction(
      workspaceId,
      'manager@fluxora.com',
      `advocacy.configure_digest (Frequency: ${config.frequency}, Day: ${config.day})`,
      'SUCCESS',
    );
    return settings;
  }

  // --- A/B TESTING ---
  async getABTests(workspaceId: string): Promise<ABTest[]> {
    return this.repository.getABTests(workspaceId);
  }

  async createABTest(
    workspaceId: string,
    test: Partial<ABTest>,
  ): Promise<ABTest> {
    const newTest = await this.repository.createABTest(workspaceId, test);
    await this.logAction(
      workspaceId,
      'marketer@fluxora.com',
      `ab_test.create (Title: "${newTest.title}", Allocation: ${newTest.allocationA}/${newTest.allocationB})`,
      'SUCCESS',
    );
    return newTest;
  }

  // --- LINK SHORTENING ---
  async getShortenedLinks(workspaceId: string): Promise<ShortenedLink[]> {
    return this.repository.getShortenedLinks(workspaceId);
  }

  async shortenLink(
    workspaceId: string,
    link: {
      originalUrl: string;
      customDomain: string;
      utmSource: string;
      utmMedium: string;
      utmCampaign: string;
    },
  ): Promise<ShortenedLink> {
    const newLink = await this.repository.shortenLink(workspaceId, link);
    await this.logAction(
      workspaceId,
      'marketer@fluxora.com',
      `link.shorten (Original: "${link.originalUrl}", Shortened: "${newLink.shortenedUrl}")`,
      'SUCCESS',
    );
    return newLink;
  }

  async resolveAndClickLink(
    host: string,
    code: string,
  ): Promise<ShortenedLink | null> {
    return this.repository.resolveAndClickLink(host, code);
  }

  // --- COMPLIANCE & AUDIT ---
  async getAuditLogs(workspaceId: string): Promise<AuditLog[]> {
    return this.repository.getAuditLogs(workspaceId);
  }

  checkComplianceContent(content: string): {
    compliant: boolean;
    flaggedKeywords: string[];
  } {
    // Legal Compliance keywords (prohibited words in social media communications/financial claims)
    const prohibited = [
      'guaranteed returns',
      'risk-free investment',
      'insider trading',
      'buy now double',
      '100% win rate',
      'no-fail profit',
      'manipulate price',
      'ponzi scheme',
      'tax evasion',
    ];

    const flagged = prohibited.filter((word) =>
      content.toLowerCase().includes(word.toLowerCase()),
    );

    return {
      compliant: flagged.length === 0,
      flaggedKeywords: flagged,
    };
  }

  async saveSecurityConfig(
    workspaceId: string,
    twoFactorEnabled: boolean,
    retentionDays: number,
  ): Promise<WorkspaceSettings> {
    const settings = await this.repository.updateSettings(workspaceId, {
      twoFactorEnabled,
      retentionDays,
    });

    await this.logAction(
      workspaceId,
      'superadmin@fluxora.com',
      `security.configure (2FA Enforce: ${twoFactorEnabled}, Retention: ${retentionDays} days)`,
      'SUCCESS',
    );

    return settings;
  }

  // --- LOG ACTIONS ---
  async logAction(
    workspaceId: string,
    actor: string,
    action: string,
    status: string,
  ): Promise<AuditLog> {
    return this.repository.logAction(workspaceId, actor, action, status);
  }

  // --- SETTINGS HELPER ---
  async getOrCreateSettings(workspaceId: string): Promise<WorkspaceSettings> {
    return this.repository.getOrCreateSettings(workspaceId);
  }

  // --- COMMUNITY CRM ---
  async getInboxMessages(workspaceId: string): Promise<InboxMessage[]> {
    return this.repository.getInboxMessages(workspaceId);
  }

  async replyToInboxMessage(
    workspaceId: string,
    messageId: string,
    replyText: string,
  ): Promise<InboxMessage> {
    const message = await this.repository.replyToInboxMessage(
      workspaceId,
      messageId,
      replyText,
    );
    await this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `inbox.reply (Message ID: ${messageId})`,
      'SUCCESS',
    );
    return message;
  }

  async assignInboxMessage(
    workspaceId: string,
    messageId: string,
    teamMember: string,
  ): Promise<InboxMessage> {
    const message = await this.repository.assignInboxMessage(
      workspaceId,
      messageId,
      teamMember,
    );
    await this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `inbox.assign (Message ID: ${messageId}, AssignedTo: ${teamMember})`,
      'SUCCESS',
    );
    return message;
  }

  // --- TAXONOMY & TAGGING ---
  async getTaxonomyTags(workspaceId: string): Promise<{
    tags: TaxonomyTag[];
    collections: AutoCollection[];
    weights: TopicWeight[];
  }> {
    return this.repository.getTaxonomyTags(workspaceId);
  }

  async createTaxonomyTag(
    workspaceId: string,
    tag: Partial<TaxonomyTag>,
  ): Promise<TaxonomyTag> {
    const newTag = await this.repository.createTaxonomyTag(workspaceId, tag);
    await this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `taxonomy.create_tag (Tag: "${newTag.name}")`,
      'SUCCESS',
    );
    return newTag;
  }

  async saveTopicWeights(
    workspaceId: string,
    weights: Array<{ category: string; weight: number }>,
  ): Promise<TopicWeight[]> {
    const updated = await this.repository.saveTopicWeights(
      workspaceId,
      weights,
    );
    await this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `taxonomy.save_weights`,
      'SUCCESS',
    );
    return updated;
  }

  async bulkUpdateMetadata(
    workspaceId: string,
    assetIds: string[],
    tags: string[],
  ): Promise<{ success: boolean; count: number }> {
    await this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `media.bulk_update_tags (Assets: ${assetIds.join(', ')}, Tags added: ${tags.join(', ')})`,
      'SUCCESS',
    );
    return { success: true, count: assetIds.length };
  }

  // --- MEDIA STUDIO TRANSFORMER ---
  async transformMediaItem(
    workspaceId: string,
    body: any,
  ): Promise<MediaStudioItem> {
    const item = await this.repository.transformMediaItem(workspaceId, body);
    await this.logAction(
      workspaceId,
      'admin@fluxora.com',
      `media.transform (Asset: ${body.assetId})`,
      'SUCCESS',
    );
    return item;
  }
}
