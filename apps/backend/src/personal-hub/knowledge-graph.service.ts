import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);
  private qdrantUrl = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
  ) {
    this.qdrantUrl = this.configService.get<string>('QDRANT_URL', '');
  }

  private getContext() {
    const workspaceId = this.tenantService.getWorkspaceId();
    const tenantId = this.tenantService.getTenantId();
    const userId = this.tenantService.getUserId() || 'anonymous';
    return { workspaceId, tenantId, userId };
  }

  async addNode(type: string, name: string, properties: any = {}) {
    const { workspaceId, tenantId, userId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Context missing');

    const node = await this.prisma.knowledgeGraphNode.create({
      data: {
        workspaceId,
        tenantId,
        userId,
        type,
        name,
        properties: properties ? JSON.parse(JSON.stringify(properties)) : {},
      },
    });

    await this.syncToQdrant(node);
    return node;
  }

  async addEdge(sourceNodeId: string, targetNodeId: string, relationshipType: string, properties: any = {}) {
    const { workspaceId, tenantId } = this.getContext();
    if (!workspaceId || !tenantId) throw new Error('Context missing');

    return this.prisma.knowledgeGraphEdge.create({
      data: {
        workspaceId,
        tenantId,
        sourceNodeId,
        targetNodeId,
        relationshipType,
        properties: properties ? JSON.parse(JSON.stringify(properties)) : {},
      },
    });
  }

  async getNodesAndEdges() {
    const { workspaceId } = this.getContext();
    if (!workspaceId) throw new Error('Workspace context missing');

    const nodes = await this.prisma.knowledgeGraphNode.findMany({
      where: { workspaceId },
    });

    const edges = await this.prisma.knowledgeGraphEdge.findMany({
      where: { workspaceId },
    });

    return { nodes, edges };
  }

  async getRelevantContext(query: string): Promise<string[]> {
    const { workspaceId } = this.getContext();
    if (!workspaceId) return [];

    // 1. Try Qdrant semantic search
    if (this.qdrantUrl) {
      try {
        const qdrantRes = await axios.post(
          `${this.qdrantUrl}/collections/personal_knowledge_graphs/points/search`,
          {
            vector: Array(1536).fill(0.0), // Mock vector for general search
            limit: 5,
            filter: {
              must: [
                { key: 'workspaceId', match: { value: workspaceId } }
              ]
            },
            with_payload: true,
          },
          { timeout: 1500 },
        );
        const points = qdrantRes.data?.result || [];
        if (points.length > 0) {
          return points.map((p: any) => `${p.payload?.type}: ${p.payload?.name}`);
        }
      } catch (err: any) {
        this.logger.warn(`Qdrant search failed: ${err.message}. Falling back to PostgreSQL relational lookup.`);
      }
    }

    // 2. Relational fallback
    const nodes = await this.prisma.knowledgeGraphNode.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    return nodes.map((n) => `${n.type}: ${n.name}`);
  }

  private async syncToQdrant(node: any) {
    if (!this.qdrantUrl) return;

    try {
      // Create collection if not exists (ignore error if exists)
      await axios.put(`${this.qdrantUrl}/collections/personal_knowledge_graphs`, {
        vectors: {
          size: 1536,
          distance: 'Cosine'
        }
      }, { timeout: 1500 }).catch(() => {});

      // Insert point
      await axios.post(`${this.qdrantUrl}/collections/personal_knowledge_graphs/points`, {
        points: [
          {
            id: node.id,
            vector: Array(1536).fill(0.01), // mock vector
            payload: {
              workspaceId: node.workspaceId,
              nodeId: node.id,
              type: node.type,
              name: node.name,
              properties: node.properties,
            }
          }
        ]
      }, { timeout: 1500 });

      this.logger.log(`Synced node ${node.id} to Qdrant`);
    } catch (err: any) {
      this.logger.warn(`Qdrant synchronization failed: ${err.message}`);
    }
  }
}
