import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

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

interface SandboxData {
  documents: MemoryDocument[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

@Injectable()
export class OrganizationalMemoryService implements OnModuleInit {
  private readonly logger = new Logger(OrganizationalMemoryService.name);
  private readonly filePath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'organizational-memory-sandbox.json',
  );

  private data: SandboxData = {
    documents: [],
    nodes: [],
    edges: [],
  };

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.ensureDirectoryExists();
    this.loadData();
    this.seedInitialMemory();
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
          documents: parsed.documents || [],
          nodes: parsed.nodes || [],
          edges: parsed.edges || [],
        };
      } else {
        this.saveData();
      }
    } catch (error) {
      this.logger.error('Failed to load organizational memory sandbox data:', error);
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
      this.logger.error('Failed to write organizational memory sandbox data:', error);
    }
  }

  // Generate mock vector embeddings (1536-dimensional using keyword/char distribution hashes)
  private generateMockEmbedding(text: string): number[] {
    const embedding = new Array(128).fill(0); // Use 128 dimensions for efficiency in mock
    const cleanText = text.toLowerCase();
    for (let i = 0; i < cleanText.length; i++) {
      const code = cleanText.charCodeAt(i);
      embedding[code % 128] += 1;
    }
    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map((val) => val / magnitude);
  }

  // Calculate cosine similarity between two vectors
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
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
    const docId = `mem-${Math.random().toString(36).substr(2, 9)}`;
    const embedding = this.generateMockEmbedding(content);

    const doc: MemoryDocument = {
      id: docId,
      workspaceId,
      category,
      content,
      embedding,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.data.documents.push(doc);

    // Create a node in the graph
    const node: GraphNode = {
      id: docId,
      workspaceId,
      type: category,
      name: title,
      properties: metadata,
      createdAt: new Date().toISOString(),
    };
    this.data.nodes.push(node);

    // Extract potential entities from content to establish relations
    if (metadata.targets) {
      const targets = Array.isArray(metadata.targets) ? metadata.targets : [metadata.targets];
      for (const target of targets) {
        // Find or create Target Node
        let targetNode = this.data.nodes.find(
          (n) => n.workspaceId === workspaceId && n.type === 'AUDIENCE' && n.name === target,
        );
        if (!targetNode) {
          targetNode = {
            id: `node-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId,
            type: 'AUDIENCE',
            name: target,
            properties: {},
            createdAt: new Date().toISOString(),
          };
          this.data.nodes.push(targetNode);
        }

        // Create Edge: Campaign targets Audience
        const edge: GraphEdge = {
          id: `edge-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId,
          sourceNodeId: node.id,
          targetNodeId: targetNode.id,
          relationshipType: 'TARGETS',
          properties: {},
          createdAt: new Date().toISOString(),
        };
        this.data.edges.push(edge);
      }
    }

    this.saveData();
    return doc;
  }

  // Search memories using hybrid vector similarity and category filtering
  async searchMemories(
    workspaceId: string,
    queryText: string,
    category?: MemoryDocument['category'],
    limit = 5,
  ): Promise<Array<{ document: MemoryDocument; similarity: number }>> {
    const queryEmbedding = this.generateMockEmbedding(queryText);
    const filteredDocs = this.data.documents.filter(
      (d) => d.workspaceId === workspaceId && (!category || d.category === category),
    );

    const results = filteredDocs.map((doc) => {
      const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding);
      return { document: doc, similarity };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  // Traverse the knowledge graph to fetch related campaign outcomes
  async getRelatedEntities(workspaceId: string, nodeId: string) {
    const edges = this.data.edges.filter(
      (e) => e.workspaceId === workspaceId && (e.sourceNodeId === nodeId || e.targetNodeId === nodeId),
    );

    const relatedNodeIds = edges.map((e) =>
      e.sourceNodeId === nodeId ? e.targetNodeId : e.sourceNodeId,
    );

    const nodes = this.data.nodes.filter(
      (n) => n.workspaceId === workspaceId && relatedNodeIds.includes(n.id),
    );

    return { node: this.data.nodes.find((n) => n.id === nodeId), edges, relatedNodes: nodes };
  }

  // Seed some initial memory context if empty
  private seedInitialMemory() {
    if (this.data.documents.length > 0) return;

    const ws1 = 'ws-1';

    // Seed campaign memory 1
    this.recordMemory(
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
    this.recordMemory(
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

    this.logger.log('Seeded initial mock memories in sandbox.');
  }
}
