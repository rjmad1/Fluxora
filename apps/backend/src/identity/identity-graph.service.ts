import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

interface SandboxData {
  profiles: ResolvedProfile[];
  nodes: IdentityNode[];
  edges: IdentityEdge[];
}

@Injectable()
export class IdentityGraphService implements OnModuleInit {
  private readonly logger = new Logger(IdentityGraphService.name);
  private readonly filePath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'identity-graph-sandbox.json',
  );

  private data: SandboxData = {
    profiles: [],
    nodes: [],
    edges: [],
  };

  onModuleInit() {
    this.ensureDirectoryExists();
    this.loadData();
  }

  private ensureDirectoryExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(content);
        this.data = {
          profiles: parsed.profiles || [],
          nodes: parsed.nodes || [],
          edges: parsed.edges || [],
        };
      } else {
        this.saveData();
      }
    } catch (error) {
      this.logger.error('Failed to load identity graph sandbox data:', error);
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.data, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('Failed to write identity graph sandbox data:', error);
    }
  }

  // Find existing profile by identifier
  async findProfileByIdentifier(
    workspaceId: string,
    type: IdentityNode['identifierType'],
    value: string,
  ): Promise<ResolvedProfile | null> {
    const node = this.data.nodes.find(
      (n) =>
        n.workspaceId === workspaceId &&
        n.identifierType === type &&
        n.identifierValue === value,
    );
    if (!node) return null;

    return (
      this.data.profiles.find((p) => p.id === node.resolvedProfileId) || null
    );
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
    const nodeMap = new Map<string, IdentityNode>();

    // 1. Process deterministic identifiers
    for (const ident of identifiers) {
      const node = this.data.nodes.find(
        (n) =>
          n.workspaceId === workspaceId &&
          n.identifierType === ident.type &&
          n.identifierValue === ident.value,
      );
      if (node) {
        matchedProfileIds.add(node.resolvedProfileId);
        nodeMap.set(`${ident.type}:${ident.value}`, node);
      }
    }

    // 2. Process probabilistic identifiers
    for (const match of probabilisticMatches) {
      if (match.confidence >= 0.75) {
        // High confidence threshold
        const node = this.data.nodes.find(
          (n) =>
            n.workspaceId === workspaceId &&
            n.identifierType === match.type &&
            n.identifierValue === match.value,
        );
        if (node) {
          matchedProfileIds.add(node.resolvedProfileId);
          nodeMap.set(`${match.type}:${match.value}`, node);
        }
      }
    }

    let targetProfile: ResolvedProfile;

    if (matchedProfileIds.size === 0) {
      // Create a brand new profile
      targetProfile = {
        id: `prof-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        traits: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.profiles.push(targetProfile);
    } else if (matchedProfileIds.size === 1) {
      // Single match
      const profileId = Array.from(matchedProfileIds)[0];
      targetProfile = this.data.profiles.find((p) => p.id === profileId)!;
    } else {
      // Merge conflict: stitch multiple profiles into the oldest profile
      const profiles = Array.from(matchedProfileIds)
        .map((id) => this.data.profiles.find((p) => p.id === id)!)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      targetProfile = profiles[0]; // Oldest profile
      const sourceProfiles = profiles.slice(1);

      // Re-stitch all nodes pointing to merged profiles
      for (const pToMerge of sourceProfiles) {
        this.data.nodes.forEach((n) => {
          if (n.resolvedProfileId === pToMerge.id) {
            n.resolvedProfileId = targetProfile.id;
          }
        });

        // Merge traits
        targetProfile.traits = {
          ...pToMerge.traits,
          ...targetProfile.traits,
        };

        // Remove merged profile
        this.data.profiles = this.data.profiles.filter(
          (p) => p.id !== pToMerge.id,
        );
        this.logger.log(`Merged profile ${pToMerge.id} into ${targetProfile.id}`);
      }
    }

    // Upsert nodes for all incoming identifiers
    const allInputs = [
      ...identifiers.map((i) => ({ ...i, confidence: 1.0, isDeterministic: true })),
      ...probabilisticMatches.map((i) => ({
        ...i,
        isDeterministic: false,
      })),
    ];

    const createdNodes: IdentityNode[] = [];
    for (const input of allInputs) {
      let node = this.data.nodes.find(
        (n) =>
          n.workspaceId === workspaceId &&
          n.identifierType === input.type &&
          n.identifierValue === input.value,
      );

      if (!node) {
        node = {
          id: `node-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId,
          identifierType: input.type,
          identifierValue: input.value,
          resolvedProfileId: targetProfile.id,
          createdAt: new Date().toISOString(),
        };
        this.data.nodes.push(node);
      } else {
        node.resolvedProfileId = targetProfile.id;
      }
      createdNodes.push(node);
    }

    // Create edges between identifiers in this resolution batch
    for (let i = 0; i < createdNodes.length; i++) {
      for (let j = i + 1; j < createdNodes.length; j++) {
        const sourceNode = createdNodes[i];
        const targetNode = createdNodes[j];

        const isDeterministic =
          allInputs.find((inp) => inp.type === sourceNode.identifierType)?.isDeterministic &&
          allInputs.find((inp) => inp.type === targetNode.identifierType)?.isDeterministic;

        const confidenceScore = isDeterministic
          ? 1.0
          : Math.min(
              allInputs.find((inp) => inp.type === sourceNode.identifierType)?.confidence || 1.0,
              allInputs.find((inp) => inp.type === targetNode.identifierType)?.confidence || 1.0,
            );

        const edgeExists = this.data.edges.some(
          (e) =>
            (e.sourceNodeId === sourceNode.id && e.targetNodeId === targetNode.id) ||
            (e.sourceNodeId === targetNode.id && e.targetNodeId === sourceNode.id),
        );

        if (!edgeExists) {
          const edge: IdentityEdge = {
            id: `edge-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId,
            sourceNodeId: sourceNode.id,
            targetNodeId: targetNode.id,
            linkType: isDeterministic ? 'DETERMINISTIC_LOGIN' : 'PROBABILISTIC_BEHAVIOR',
            confidenceScore,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.data.edges.push(edge);
        }
      }
    }

    this.saveData();
    return targetProfile;
  }

  // Get active identity nodes and edges for rendering or querying
  async getIdentityGraph(workspaceId: string) {
    const nodes = this.data.nodes.filter((n) => n.workspaceId === workspaceId);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = this.data.edges.filter(
      (e) =>
        e.workspaceId === workspaceId &&
        nodeIds.has(e.sourceNodeId) &&
        nodeIds.has(e.targetNodeId),
    );
    const profiles = this.data.profiles.filter((p) => p.workspaceId === workspaceId);

    return { profiles, nodes, edges };
  }
}
