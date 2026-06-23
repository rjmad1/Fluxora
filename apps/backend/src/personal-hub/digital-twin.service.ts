import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class DigitalTwinService {
  private readonly logger = new Logger(DigitalTwinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getContext() {
    const workspaceId = this.tenantService.getWorkspaceId();
    const tenantId = this.tenantService.getTenantId();
    const userId = this.tenantService.getUserId() || 'anonymous';
    return { workspaceId, tenantId, userId };
  }

  async getOrCreateDigitalTwin() {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Context missing');

    let twin = await this.prisma.userDigitalTwin.findUnique({
      where: { workspaceId },
    });

    if (!twin) {
      twin = await this.prisma.userDigitalTwin.create({
        data: {
          workspaceId,
          tenantId,
          userId,
          formalityLevel: 0.5,
          creativityLevel: 0.7,
          postingHabits: {},
          engagementStyle: 'Empathetic and Analytical',
          vocabularyRules: {},
          thoughtLeadership: ['Tech Innovation', 'Founder Journeys'],
          promptTemplate:
            'Write in a clean, concise, and structured tone. Use short paragraphs.',
        },
      });
      await this.saveHistory('UserDigitalTwin', twin.id, twin);
    }

    return twin;
  }

  async updateDigitalTwin(data: any) {
    const twin = await this.getOrCreateDigitalTwin();

    const updated = await this.prisma.userDigitalTwin.update({
      where: { id: twin.id },
      data: {
        formalityLevel: data.formalityLevel ?? twin.formalityLevel,
        creativityLevel: data.creativityLevel ?? twin.creativityLevel,
        postingHabits: data.postingHabits,
        engagementStyle: data.engagementStyle,
        vocabularyRules: data.vocabularyRules,
        thoughtLeadership: data.thoughtLeadership,
        promptTemplate: data.promptTemplate,
        aiMetadata: data.aiMetadata,
      },
    });

    await this.saveHistory('UserDigitalTwin', updated.id, updated);
    return updated;
  }

  async getOrCreateVoiceProfile() {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Context missing');

    let voice = await this.prisma.userVoiceProfile.findUnique({
      where: { workspaceId },
    });

    if (!voice) {
      voice = await this.prisma.userVoiceProfile.create({
        data: {
          workspaceId,
          tenantId,
          userId,
          toneDescription: 'Professional, Visionary, Direct',
          writingStyle: 'Conversational business writing',
          vocabularyPrefs: {
            preferred: ['empower', 'scale', 'streamline'],
            avoid: ['synergy', 'game-changer'],
          },
          ctaPreferences: ['Join the conversation', 'Read the full article'],
        },
      });
      await this.saveHistory('UserVoiceProfile', voice.id, voice);
    }
    return voice;
  }

  async updateVoiceProfile(data: any) {
    const voice = await this.getOrCreateVoiceProfile();

    const updated = await this.prisma.userVoiceProfile.update({
      where: { id: voice.id },
      data: {
        toneDescription: data.toneDescription,
        writingStyle: data.writingStyle,
        vocabularyPrefs: data.vocabularyPrefs,
        ctaPreferences: data.ctaPreferences,
        aiMetadata: data.aiMetadata,
      },
    });

    await this.saveHistory('UserVoiceProfile', updated.id, updated);
    return updated;
  }

  private async saveHistory(
    entityType: string,
    entityId: string,
    snapshot: any,
  ) {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) return;

    const latest = await this.prisma.personalHistory.findFirst({
      where: { workspaceId, entityType, entityId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latest ? latest.version + 1 : 1;

    await this.prisma.personalHistory.create({
      data: {
        workspaceId,
        tenantId,
        entityType,
        entityId,
        version: nextVersion,
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        changedBy: userId,
      },
    });
  }
}
