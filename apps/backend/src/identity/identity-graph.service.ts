import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import {
  ResolvedProfile as PrismaResolvedProfile,
  IdentityNode as PrismaIdentityNode,
} from '@prisma/client';

export interface ResolvedProfile {
  id: string;
  workspaceId: string;
  traits: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityNode {
  id: string;
  workspaceId: string;
  identifierType: 'EMAIL' | 'COOKIE' | 'TWITTER_HANDLE' | 'CRM_ID' | 'PHONE';
  identifierValue: string;
  resolvedProfileId: string;
  createdAt: string;
}

export interface IdentityEdge {
  id: string;
  workspaceId: string;
  sourceNodeId: string;
  targetNodeId: string;
  linkType: 'DETERMINISTIC_LOGIN' | 'PROBABILISTIC_BEHAVIOR';
  confidenceScore: number; // 0.0 to 1.0
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class IdentityGraphService {
  private readonly logger = new Logger(IdentityGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Find existing profile by identifier
  async findProfileByIdentifier(
    workspaceId: string,
    type: IdentityNode['identifierType'],
    value: string,
  ): Promise<ResolvedProfile | null> {
    const node = await this.prisma.identityNode.findFirst({
      where: {
        workspaceId,
        identifierType: type,
        identifierValue: value,
      },
      include: {
        resolvedProfile: true,
      },
    });
    if (!node || !node.resolvedProfile) return null;

    const p = node.resolvedProfile;
    return {
      id: p.id,
      workspaceId: p.workspaceId,
      traits: (p.traits as Record<string, any>) || {},
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  // Deterministic and probabilistic stitching engine
  async resolveProfile(
    workspaceId: string,
    identifiers: Array<{ type: IdentityNode['identifierType']; value: string }>,
    probabilisticMatches: Array<{
      type: IdentityNode['identifierType'];
      value: string;
      confidence: number;
    }> = [],
  ): Promise<ResolvedProfile> {
    const matchedProfileIds = new Set<string>();

    // 1. Process deterministic identifiers
    if (identifiers.length > 0) {
      const nodes = await this.prisma.identityNode.findMany({
        where: {
          workspaceId,
          OR: identifiers.map((ident) => ({
            identifierType: ident.type,
            identifierValue: ident.value,
          })),
        },
      });
      for (const node of nodes) {
        matchedProfileIds.add(node.resolvedProfileId);
      }
    }

    // 2. Process probabilistic identifiers
    const highConfProbMatches = probabilisticMatches.filter(
      (m) => m.confidence >= 0.75,
    );
    if (highConfProbMatches.length > 0) {
      const nodes = await this.prisma.identityNode.findMany({
        where: {
          workspaceId,
          OR: highConfProbMatches.map((match) => ({
            identifierType: match.type,
            identifierValue: match.value,
          })),
        },
      });
      for (const node of nodes) {
        matchedProfileIds.add(node.resolvedProfileId);
      }
    }

    let targetProfile: PrismaResolvedProfile;

    if (matchedProfileIds.size === 0) {
      // Create a brand new profile
      targetProfile = await this.prisma.resolvedProfile.create({
        data: {
          workspaceId,
          traits: {},
        },
      });
    } else if (matchedProfileIds.size === 1) {
      // Single match
      const profileId = Array.from(matchedProfileIds)[0];
      const p = await this.prisma.resolvedProfile.findUnique({
        where: { id: profileId },
      });
      if (!p) {
        targetProfile = await this.prisma.resolvedProfile.create({
          data: {
            workspaceId,
            traits: {},
          },
        });
      } else {
        targetProfile = p;
      }
    } else {
      // Merge conflict: stitch multiple profiles into the oldest profile
      const profiles = await this.prisma.resolvedProfile.findMany({
        where: { id: { in: Array.from(matchedProfileIds) } },
        orderBy: { createdAt: 'asc' },
      });

      targetProfile = profiles[0]; // Oldest profile
      const sourceProfiles = profiles.slice(1);
      const sourceProfileIds = sourceProfiles.map((p) => p.id);

      // Merge traits
      let mergedTraits = (targetProfile.traits as Record<string, any>) || {};
      for (const pToMerge of sourceProfiles) {
        mergedTraits = {
          ...((pToMerge.traits as Record<string, any>) || {}),
          ...mergedTraits,
        };
      }

      // Re-stitch nodes and delete merged profiles in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.identityNode.updateMany({
          where: { resolvedProfileId: { in: sourceProfileIds } },
          data: { resolvedProfileId: targetProfile.id },
        });
        await tx.resolvedProfile.update({
          where: { id: targetProfile.id },
          data: { traits: mergedTraits },
        });
        await tx.resolvedProfile.deleteMany({
          where: { id: { in: sourceProfileIds } },
        });
      });

      // Update traits on local instance
      targetProfile.traits = mergedTraits;
      this.logger.log(
        `Merged profiles ${sourceProfileIds.join(', ')} into ${targetProfile.id}`,
      );
    }

    // Upsert nodes for all incoming identifiers
    const allInputs = [
      ...identifiers.map((i) => ({
        ...i,
        confidence: 1.0,
        isDeterministic: true,
      })),
      ...probabilisticMatches.map((i) => ({
        ...i,
        isDeterministic: false,
      })),
    ];

    const createdNodes: PrismaIdentityNode[] = [];
    for (const input of allInputs) {
      const node = await this.prisma.identityNode.upsert({
        where: {
          workspaceId_identifierType_identifierValue: {
            workspaceId,
            identifierType: input.type,
            identifierValue: input.value,
          },
        },
        create: {
          workspaceId,
          identifierType: input.type,
          identifierValue: input.value,
          resolvedProfileId: targetProfile.id,
        },
        update: {
          resolvedProfileId: targetProfile.id,
        },
      });
      createdNodes.push(node);
    }

    // Create edges between identifiers in this resolution batch
    for (let i = 0; i < createdNodes.length; i++) {
      for (let j = i + 1; j < createdNodes.length; j++) {
        const sourceNode = createdNodes[i];
        const targetNode = createdNodes[j];

        const isDeterministic =
          allInputs.find((inp) => inp.type === sourceNode.identifierType)
            ?.isDeterministic &&
          allInputs.find((inp) => inp.type === targetNode.identifierType)
            ?.isDeterministic;

        const confidenceScore = isDeterministic
          ? 1.0
          : Math.min(
              allInputs.find((inp) => inp.type === sourceNode.identifierType)
                ?.confidence || 1.0,
              allInputs.find((inp) => inp.type === targetNode.identifierType)
                ?.confidence || 1.0,
            );

        const edgeExists = await this.prisma.identityEdge.findFirst({
          where: {
            workspaceId,
            OR: [
              { sourceNodeId: sourceNode.id, targetNodeId: targetNode.id },
              { sourceNodeId: targetNode.id, targetNodeId: sourceNode.id },
            ],
          },
        });

        if (!edgeExists) {
          await this.prisma.identityEdge.create({
            data: {
              workspaceId,
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              linkType: isDeterministic
                ? 'DETERMINISTIC_LOGIN'
                : 'PROBABILISTIC_BEHAVIOR',
              confidenceScore,
            },
          });
        }
      }
    }

    return {
      id: targetProfile.id,
      workspaceId: targetProfile.workspaceId,
      traits: (targetProfile.traits as Record<string, any>) || {},
      createdAt: targetProfile.createdAt.toISOString(),
      updatedAt: targetProfile.updatedAt.toISOString(),
    };
  }

  // Get active identity nodes and edges for rendering or querying
  async getIdentityGraph(workspaceId: string) {
    const profiles = await this.prisma.resolvedProfile.findMany({
      where: { workspaceId },
    });
    const nodes = await this.prisma.identityNode.findMany({
      where: { workspaceId },
    });
    const edges = await this.prisma.identityEdge.findMany({
      where: { workspaceId },
    });

    return {
      profiles: profiles.map((p) => ({
        id: p.id,
        workspaceId: p.workspaceId,
        traits: (p.traits as Record<string, any>) || {},
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      nodes: nodes.map((n) => ({
        id: n.id,
        workspaceId: n.workspaceId,
        identifierType: n.identifierType as any,
        identifierValue: n.identifierValue,
        resolvedProfileId: n.resolvedProfileId,
        createdAt: n.createdAt.toISOString(),
      })),
      edges: edges.map((e) => ({
        id: e.id,
        workspaceId: e.workspaceId,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        linkType: e.linkType as any,
        confidenceScore: e.confidenceScore,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
  }
}
