import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class PersonalProfileService {
  private readonly logger = new Logger(PersonalProfileService.name);

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

  async getOrCreateProfile() {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) {
      throw new Error('Workspace or Tenant context missing');
    }

    let profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.userProfile.create({
        data: {
          workspaceId,
          tenantId,
          userId,
          fullName: 'Individual Creator',
          headline: 'Professional Brand Owner',
          bio: 'Building and distributing content autonomously.',
        },
      });
      await this.saveHistory('UserProfile', profile.id, profile);
    }

    return profile;
  }

  async updateProfile(data: any) {
    const { workspaceId, tenantId, userId } = this.getContext();
    const profile = await this.getOrCreateProfile();

    const updated = await this.prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        fullName: data.fullName ?? profile.fullName,
        headline: data.headline,
        bio: data.bio,
        personalMission: data.personalMission,
        personalVision: data.personalVision,
        summary: data.summary,
        personalStory: data.personalStory,
        geographic: data.geographic,
        languages: data.languages,
        timeZone: data.timeZone,
        aiMetadata: data.aiMetadata,
      },
    });

    await this.saveHistory('UserProfile', updated.id, updated);
    return updated;
  }

  async getContentDNA() {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Workspace or Tenant context missing');

    let dna = await this.prisma.userContentDNA.findUnique({
      where: { workspaceId },
    });

    if (!dna) {
      dna = await this.prisma.userContentDNA.create({
        data: {
          workspaceId,
          tenantId,
          userId,
          preferredTopics: [],
          avoidTopics: [],
          contentCategories: [],
          publishingFreq: 'Daily',
          preferredFormats: [],
          writingStyle: 'Professional',
          ctaPreferences: [],
        },
      });
      await this.saveHistory('UserContentDNA', dna.id, dna);
    }
    return dna;
  }

  async updateContentDNA(data: any) {
    const { workspaceId, tenantId, userId } = this.getContext();
    const dna = await this.getContentDNA();

    const updated = await this.prisma.userContentDNA.update({
      where: { id: dna.id },
      data: {
        preferredTopics: data.preferredTopics,
        avoidTopics: data.avoidTopics,
        contentCategories: data.contentCategories,
        publishingFreq: data.publishingFreq,
        preferredFormats: data.preferredFormats,
        writingStyle: data.writingStyle,
        ctaPreferences: data.ctaPreferences,
        aiMetadata: data.aiMetadata,
      },
    });

    await this.saveHistory('UserContentDNA', updated.id, updated);
    return updated;
  }

  async getGoals() {
    const { workspaceId, userId } = this.getContext();
    return this.prisma.userGoal.findMany({
      where: { workspaceId, userId },
    });
  }

  async addGoal(data: any) {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Context missing');

    const goal = await this.prisma.userGoal.create({
      data: {
        workspaceId,
        tenantId,
        userId,
        category: data.category,
        description: data.description,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: 'IN_PROGRESS',
        aiMetadata: data.aiMetadata,
      },
    });
    await this.saveHistory('UserGoal', goal.id, goal);
    return goal;
  }

  async updateGoal(id: string, data: any) {
    const goal = await this.prisma.userGoal.update({
      where: { id },
      data: {
        description: data.description,
        status: data.status,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        aiMetadata: data.aiMetadata,
      },
    });
    await this.saveHistory('UserGoal', goal.id, goal);
    return goal;
  }

  async getExpertise() {
    const { workspaceId, userId } = this.getContext();
    return this.prisma.userExpertise.findMany({
      where: { workspaceId, userId },
    });
  }

  async addExpertise(data: any) {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Context missing');

    const expertise = await this.prisma.userExpertise.create({
      data: {
        workspaceId,
        tenantId,
        userId,
        topic: data.topic,
        level: data.level, // CORE, SECONDARY, EMERGING
        category: data.category, // RESEARCH, TEACHING, EXPERIENCE
        aiMetadata: data.aiMetadata,
      },
    });
    await this.saveHistory('UserExpertise', expertise.id, expertise);
    return expertise;
  }

  private async saveHistory(entityType: string, entityId: string, snapshot: any) {
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
