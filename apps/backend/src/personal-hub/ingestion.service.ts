import { Injectable, Logger } from '@nestjs/common';
import { PersonalProfileService } from './personal-profile.service';
import { KnowledgeGraphService } from './knowledge-graph.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly profileService: PersonalProfileService,
    private readonly graphService: KnowledgeGraphService,
  ) {}

  async ingestLinkedIn(profileUrl: string) {
    this.logger.log(`Ingesting LinkedIn Profile: ${profileUrl}`);

    // Mock LinkedIn profile parsing
    const extractedData = {
      fullName: 'Jane Doe',
      headline: 'Principal AI Architect & Tech Author',
      bio: 'Pioneering agentic systems and multi-agent LLM systems at Scale.',
      summary:
        '12+ years building distributed cloud infrastructure and AI intelligence layers.',
      roles: [
        {
          title: 'Principal AI Architect',
          company: 'Quantum Labs',
          industry: 'Artificial Intelligence',
        },
        { title: 'Lead Engineer', company: 'CloudCorp', industry: 'SaaS' },
      ],
      skills: [
        'TypeScript',
        'LangGraph',
        'Temporal',
        'Vector Search',
        'System Design',
      ],
      interests: ['Agentic AI', 'Knowledge Graphs', 'Thought Leadership'],
    };

    // 1. Update User Profile
    await this.profileService.updateProfile({
      fullName: extractedData.fullName,
      headline: extractedData.headline,
      bio: extractedData.bio,
      summary: extractedData.summary,
      aiMetadata: {
        source: 'LinkedIn Ingestion',
        profileUrl,
        ingestedAt: new Date().toISOString(),
      },
    });

    // 2. Enrich Knowledge Graph Nodes & Edges
    const companyNodes = [];
    for (const role of extractedData.roles) {
      const companyNode = await this.graphService.addNode(
        'Company',
        role.company,
        { industry: role.industry },
      );
      companyNodes.push(companyNode);
      await this.graphService.addNode('Expertise', role.title, {
        level: 'CORE',
        category: 'EXPERIENCE',
      });
    }

    for (const skill of extractedData.skills) {
      const skillNode = await this.graphService.addNode('Skill', skill, {
        level: 'Expert',
      });
      for (const compNode of companyNodes) {
        await this.graphService.addEdge(
          skillNode.id,
          compNode.id,
          'UTILIZED_AT',
        );
      }
    }

    for (const interest of extractedData.interests) {
      await this.graphService.addNode('Interest', interest, {
        category: 'PASSION',
        level: 'HIGH',
      });
    }

    return { success: true, message: 'LinkedIn profile ingested successfully' };
  }

  async ingestResume(resumeText: string) {
    this.logger.log(
      `Ingesting Resume/CV content of length: ${resumeText.length}`,
    );

    // Simple keyword extraction heuristics
    const skillsList = [
      'NestJS',
      'React',
      'Kubernetes',
      'Apache Kafka',
      'PostgreSQL',
      'Docker',
      'ClickHouse',
    ];
    const foundSkills = skillsList.filter((s) =>
      resumeText.toLowerCase().includes(s.toLowerCase()),
    );

    const profile = await this.profileService.getOrCreateProfile();

    // Enrich Profile summary
    await this.profileService.updateProfile({
      summary: `${profile.summary || ''} Ingested CV profile summary: Focused on backend engineering and scaling architectures.`,
    });

    // Add nodes
    for (const skill of foundSkills) {
      await this.graphService.addNode('Skill', skill, {
        level: 'Advanced',
        source: 'CV Upload',
      });
    }

    return {
      success: true,
      parsedSkills: foundSkills,
      message: 'Resume ingested and parsed successfully',
    };
  }

  async ingestWebsite(url: string) {
    this.logger.log(`Ingesting Website / Blog content: ${url}`);

    // Simulate web crawler extraction
    const extractedTopics = [
      'Observability',
      'Multi-tenant Isolation',
      'ClickHouse Aggregations',
    ];

    for (const topic of extractedTopics) {
      await this.graphService.addNode('Topic', topic, {
        source: 'Website crawl',
        url,
      });
    }

    return {
      success: true,
      extractedTopics,
      message: 'Website content analyzed and added to topics database',
    };
  }
}
