import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../tenant/prisma.service';
import axios from 'axios';

export interface MemoryDocument {
  id: string;
  workspaceId: string;
  category: 'CAMPAIGN' | 'CONTENT' | 'EXPERIMENT' | 'REVENUE';
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  workspaceId: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  workspaceId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  properties: Record<string, any>;
  createdAt: string;
}

@Injectable()
export class OrganizationalMemoryService implements OnModuleInit {
  private readonly logger = new Logger(OrganizationalMemoryService.name);
  private openaiApiKey = '';
  private geminiApiKey = '';
  private qdrantUrl = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.qdrantUrl = this.configService.get<string>('QDRANT_URL', '');
  }

  async onModuleInit() {
    await this.seedInitialMemory();
  }

  // Get active dense vector embedding via LLM or fallback
  private async getEmbedding(text: string): Promise<number[]> {
    if (this.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`;
        const res = await axios.post(
          url,
          { content: { parts: [{ text }] } },
          { timeout: 3000 },
        );
        const vector = res.data?.embedding?.values;
        if (Array.isArray(vector)) return vector;
      } catch (err: any) {
        this.logger.error(
          `Gemini embedding failed: ${err.message}. Falling back.`,
        );
      }
    }

    if (this.openaiApiKey) {
      try {
        const res = await axios.post(
          'https://api.openai.com/v1/embeddings',
          { input: text, model: 'text-embedding-3-small' },
          {
            headers: {
              Authorization: `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 3000,
          },
        );
        const vector = res.data?.data?.[0]?.embedding;
        if (Array.isArray(vector)) return vector;
      } catch (err: any) {
        this.logger.error(
          `OpenAI embedding failed: ${err.message}. Falling back.`,
        );
      }
    }

    // Local mock fallback
    const embedding = new Array(128).fill(0);
    const cleanText = text.toLowerCase();
    for (let i = 0; i < cleanText.length; i++) {
      const code = cleanText.charCodeAt(i);
      embedding[code % 128] += 1;
    }
    const magnitude =
      Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map((val) => val / magnitude);
  }

  // Calculate cosine similarity between two vectors
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const length = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  // Add campaign or creative to memory (both vector document and graph nodes/edges)
  async recordMemory(
    workspaceId: string,
    category: MemoryDocument['category'],
    title: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<MemoryDocument> {
    const embedding = await this.getEmbedding(content);

    // Create memory document
    const doc = await this.prisma.memoryDocument.create({
      data: {
        workspaceId,
        category,
        content,
        embedding,
        metadata,
      },
    });

    // Create graph node for campaign/creative
    await this.prisma.memoryNode.create({
      data: {
        id: doc.id, // Keep IDs matching
        workspaceId,
        type: category,
        name: title,
        properties: metadata,
      },
    });

    // Extract potential entities from content to establish relations
    if (metadata.targets) {
      const targets = Array.isArray(metadata.targets)
        ? metadata.targets
        : [metadata.targets];
      for (const target of targets) {
        // Find or create Target Node
        let targetNode = await this.prisma.memoryNode.findFirst({
          where: {
            workspaceId,
            type: 'AUDIENCE',
            name: target,
          },
        });
        if (!targetNode) {
          targetNode = await this.prisma.memoryNode.create({
            data: {
              workspaceId,
              type: 'AUDIENCE',
              name: target,
              properties: {},
            },
          });
        }

        // Create Edge: Campaign targets Audience
        await this.prisma.memoryEdge.create({
          data: {
            workspaceId,
            sourceNodeId: doc.id,
            targetNodeId: targetNode.id,
            relationshipType: 'TARGETS',
            properties: {},
          },
        });
      }
    }

    // Write to Qdrant collection if url is configured
    if (this.qdrantUrl) {
      try {
        // Ensure collection exists
        await axios
          .put(
            `${this.qdrantUrl}/collections/fluxora_memories`,
            {
              vectors: {
                size: embedding.length,
                distance: 'Cosine',
              },
            },
            { timeout: 1500 },
          )
          .catch(() => {});

        // Upsert point
        await axios.post(
          `${this.qdrantUrl}/collections/fluxora_memories/points`,
          {
            points: [
              {
                id: doc.id,
                vector: embedding,
                payload: {
                  workspaceId,
                  category,
                  title,
                  content,
                  metadata,
                },
              },
            ],
          },
          { timeout: 2000 },
        );
        this.logger.log(`Successfully indexed memory ${doc.id} in Qdrant.`);
      } catch (qdrantErr: any) {
        this.logger.error(`Failed to upsert to Qdrant: ${qdrantErr.message}`);
      }
    }

    return {
      id: doc.id,
      workspaceId: doc.workspaceId,
      category: doc.category as any,
      content: doc.content,
      embedding: doc.embedding,
      metadata: (doc.metadata as Record<string, any>) || {},
      createdAt: doc.createdAt.toISOString(),
    };
  }

  // Search memories using hybrid vector similarity and category filtering
  async searchMemories(
    workspaceId: string,
    queryText: string,
    category?: MemoryDocument['category'],
    limit = 5,
  ): Promise<Array<{ document: MemoryDocument; similarity: number }>> {
    const queryEmbedding = await this.getEmbedding(queryText);

    if (this.qdrantUrl) {
      try {
        this.logger.log(`Searching Qdrant collection fluxora_memories...`);
        const searchRes = await axios.post(
          `${this.qdrantUrl}/collections/fluxora_memories/points/search`,
          {
            vector: queryEmbedding,
            limit,
            filter: {
              must: [
                { key: 'workspaceId', match: { value: workspaceId } },
                ...(category
                  ? [{ key: 'category', match: { value: category } }]
                  : []),
              ],
            },
            with_payload: true,
          },
          { timeout: 2000 },
        );

        const hits = searchRes.data?.result || [];
        if (hits.length > 0) {
          return hits.map((hit: any) => ({
            document: {
              id: hit.id,
              workspaceId: hit.payload?.workspaceId,
              category: hit.payload?.category,
              content: hit.payload?.content || '',
              embedding: queryEmbedding,
              metadata: hit.payload?.metadata || {},
              createdAt: new Date().toISOString(),
            },
            similarity: hit.score || 0,
          }));
        }
      } catch (qdrantErr: any) {
        this.logger.error(
          `Qdrant search failed: ${qdrantErr.message}. Falling back to PostgreSQL similarity.`,
        );
      }
    }

    // Local fallback PostgreSQL similarity search
    const filteredDocs = await this.prisma.memoryDocument.findMany({
      where: {
        workspaceId,
        ...(category ? { category } : {}),
      },
    });

    const results = filteredDocs.map((doc) => {
      const similarity = this.calculateCosineSimilarity(
        queryEmbedding,
        doc.embedding,
      );
      return {
        document: {
          id: doc.id,
          workspaceId: doc.workspaceId,
          category: doc.category as any,
          content: doc.content,
          embedding: doc.embedding,
          metadata: (doc.metadata as Record<string, any>) || {},
          createdAt: doc.createdAt.toISOString(),
        },
        similarity,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  // Traverse the knowledge graph to fetch related campaign outcomes
  async getRelatedEntities(workspaceId: string, nodeId: string) {
    const edges = await this.prisma.memoryEdge.findMany({
      where: {
        workspaceId,
        OR: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
      },
    });

    const relatedNodeIds = edges.map((e) =>
      e.sourceNodeId === nodeId ? e.targetNodeId : e.sourceNodeId,
    );

    const nodes = await this.prisma.memoryNode.findMany({
      where: {
        workspaceId,
        id: { in: relatedNodeIds },
      },
    });

    const node = await this.prisma.memoryNode.findFirst({
      where: { id: nodeId, workspaceId },
    });

    return {
      node: node
        ? {
            id: node.id,
            workspaceId: node.workspaceId,
            type: node.type,
            name: node.name,
            properties: (node.properties as Record<string, any>) || {},
            createdAt: node.createdAt.toISOString(),
          }
        : undefined,
      edges: edges.map((e) => ({
        id: e.id,
        workspaceId: e.workspaceId,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        relationshipType: e.relationshipType,
        properties: (e.properties as Record<string, any>) || {},
        createdAt: e.createdAt.toISOString(),
      })),
      relatedNodes: nodes.map((n) => ({
        id: n.id,
        workspaceId: n.workspaceId,
        type: n.type,
        name: n.name,
        properties: (n.properties as Record<string, any>) || {},
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  // Seed some initial memory context if empty
  private async seedInitialMemory() {
    const count = await this.prisma.memoryDocument.count();
    if (count > 0) return;

    const ws1 = 'ws-1';

    // Seed campaign memory 1
    await this.recordMemory(
      ws1,
      'CAMPAIGN',
      'Q1 developer observability launch',
      'The campaign focused on promoting real-time telemetry streaming using ClickHouse and Kafka. The key messaging highlights analytics queries completing in under 500ms. We ran this across Twitter and LinkedIn, targeting DevOps engineers and System Architects.',
      {
        targets: ['DevOps', 'Architects'],
        budgetSpent: 4500,
        revenueGenerated: 12500,
      },
    );

    // Seed campaign memory 2
    await this.recordMemory(
      ws1,
      'CAMPAIGN',
      'SaaS Churn Reduction Email sequence',
      'We launched a 4-part automated email nurturing sequence targeting accounts with reduced event activity within the past 14 days. Emphasized custom domain setups and team onboarding features. The conversions were measured based on workspace retention.',
      {
        targets: ['Product Managers', 'Customer Success'],
        budgetSpent: 800,
        revenueGenerated: 3400,
      },
    );

    this.logger.log('Seeded initial mock memories in database.');
  }
}
