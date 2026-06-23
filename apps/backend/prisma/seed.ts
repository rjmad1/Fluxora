import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:change-me-in-production@localhost:54321/fluxora_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('Seeding initial mock data...');

  const ws1 = 'ws-1';
  const ws2 = 'ws-2';
  const tenantId = 'tenant-1';

  // 1. Ensure default tenant & workspaces exist in PostgreSQL database
  const tenantExists = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  if (!tenantExists) {
    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Default Tenant',
      },
    });
  }

  for (const wsId of [ws1, ws2]) {
    const wsExists = await prisma.workspace.findUnique({
      where: { id: wsId },
    });
    if (!wsExists) {
      await prisma.workspace.create({
        data: {
          id: wsId,
          tenantId,
          name: wsId === ws1 ? 'Workspace One' : 'Workspace Two',
        },
      });
    }
  }

  // 2. Check if we have seeded already
  const mentionCount = await prisma.brandMention.count();
  if (mentionCount > 0) {
    console.log('Database already has seeded data. Skipping seed.');
    return;
  }

  // 3. Seed Workspace Settings
  await prisma.workspaceSettings.createMany({
    data: [
      {
        workspaceId: ws1,
        twoFactorEnabled: false,
        retentionDays: 90,
        trackedKeywords: ['Fluxora', 'telemetry', 'ClickHouse', 'Postgres RLS'],
        emailDigest: {
          enabled: true,
          frequency: 'weekly',
          day: 'Friday',
          time: '09:00',
        },
      },
      {
        workspaceId: ws2,
        twoFactorEnabled: true,
        retentionDays: 180,
        trackedKeywords: ['CompetitorA', 'GlobalBrand'],
        emailDigest: {
          enabled: false,
          frequency: 'monthly',
          day: 'Monday',
          time: '12:00',
        },
      },
    ],
  });

  // 4. Seed Brand Mentions
  await prisma.brandMention.createMany({
    data: [
      {
        id: 'men-1',
        workspaceId: ws1,
        content: 'Fluxora platform is incredibly fast! Migrated our telemetry and saw analytics load in <500ms.',
        platform: 'twitter',
        sentiment: 'positive',
        source: '@dev_ops_jane',
        timestamp: new Date(Date.now() - 3600000 * 2),
        ticketCreated: false,
      },
      {
        id: 'men-2',
        workspaceId: ws1,
        content: 'Trouble configuring the custom domain redirection for short links in workspace A. Keeps returning 404.',
        platform: 'linkedin',
        sentiment: 'negative',
        source: 'Marcus Vance, Enterprise VP',
        timestamp: new Date(Date.now() - 3600000 * 4),
        ticketCreated: true,
        ticketId: 'TKT-88902',
      },
      {
        id: 'men-3',
        workspaceId: ws1,
        content: 'Fluxora social media blast is scheduled for next Tuesday. Let us see how click-through rates diverge.',
        platform: 'facebook',
        sentiment: 'neutral',
        source: 'Agency Ops Hub',
        timestamp: new Date(Date.now() - 3600000 * 8),
        ticketCreated: false,
      },
    ],
  });

  // 5. Seed Competitors
  const comps = [
    {
      id: 'comp-1',
      workspaceId: ws1,
      name: 'BufferStream Inc',
      handle: '@bufferstream',
      followers: 245000,
      engagementRate: 2.4,
      shareOfVoice: 35,
    },
    {
      id: 'comp-2',
      workspaceId: ws1,
      name: 'Hootsync',
      handle: '@hootsync',
      followers: 512000,
      engagementRate: 1.8,
      shareOfVoice: 42,
    },
    {
      id: 'comp-3',
      workspaceId: ws1,
      name: 'SproutVibe',
      handle: '@sproutvibe',
      followers: 98000,
      engagementRate: 4.1,
      shareOfVoice: 23,
    },
  ];

  for (const comp of comps) {
    await prisma.competitor.create({
      data: {
        ...comp,
        posts: {
          createMany: {
            data: [
              {
                content: 'PG benchmark highlights 10x gains!',
                engagementType: 'likes',
                engagementCount: 1420,
              },
            ],
          },
        },
        mixes: {
          create: {
            video: 40,
            image: 45,
            text: 15,
          },
        },
        frequencies: {
          create: {
            frequency: '4 posts/day',
            pattern: '9AM, 1PM, 5PM EST',
          },
        },
      },
    });
  }

  // 6. Seed Templates
  await prisma.postTemplate.createMany({
    data: [
      {
        id: 'tpl-1',
        workspaceId: ws1,
        title: 'Enterprise Scalability Launch',
        content: 'Thrilled to unveil our high-throughput telemetry stream powered by Kafka and ClickHouse! Real-time aggregates in under 500ms ⚡ #BigData #Scale',
        category: 'Product Launch',
        author: 'Admin Team',
        expiresAt: new Date(Date.now() + 86400000 * 30),
        sharedCount: 42,
      },
      {
        id: 'tpl-2',
        workspaceId: ws1,
        title: 'Hiring Notice: Senior SRE',
        content: 'We are expanding! Looking for an expert in NestJS, Postgres RLS boundaries, and Temporal workflows. Apply today: {link} #Hiring #SRE #TechJobs',
        category: 'Recruiting',
        author: 'HR Dept',
        expiresAt: new Date(Date.now() + 86400000 * 15),
        sharedCount: 18,
      },
      {
        id: 'tpl-3',
        workspaceId: ws1,
        title: 'System Maintenance Alert',
        content: 'Fluxora systems will undergo scheduled telemetry database replication audits on June 18th at 03:00 UTC. Fallback log servers are active.',
        category: 'Corporate Notice',
        author: 'Security Lead',
        expiresAt: new Date(Date.now() + 86400000 * 3),
        sharedCount: 5,
      },
    ],
  });

  // 7. Seed Leaderboard
  await prisma.leaderboardEntry.createMany({
    data: [
      {
        id: 'lead-1',
        workspaceId: ws1,
        employeeName: 'Sarah Jenkins',
        department: 'Sales & Growth',
        postsShared: 28,
        reach: 45000,
        points: 1420,
      },
      {
        id: 'lead-2',
        workspaceId: ws1,
        employeeName: 'Alex Mercer',
        department: 'Engineering',
        postsShared: 22,
        reach: 38200,
        points: 1150,
      },
      {
        id: 'lead-3',
        workspaceId: ws1,
        employeeName: 'Elena Rostova',
        department: 'Product Management',
        postsShared: 19,
        reach: 21000,
        points: 950,
      },
      {
        id: 'lead-4',
        workspaceId: ws1,
        employeeName: 'Dave K.',
        department: 'Marketing',
        postsShared: 14,
        reach: 18400,
        points: 720,
      },
    ],
  });

  // 8. Seed ABTests
  await prisma.aBTest.createMany({
    data: [
      {
        id: 'test-1',
        workspaceId: ws1,
        title: 'CTA Button Placement Experiment',
        variantA: 'Check out our ClickHouse performance dashboard today! {link}',
        variantB: 'Ready to scale telemetry? Try the new real-time performance dashboard! {link}',
        allocationA: 50,
        allocationB: 50,
        winnerCriteria: 'clicks',
        status: 'completed',
        winner: 'B',
        conversionA: 3.8,
        conversionB: 5.9,
        performanceA: [12, 24, 38, 48, 55, 68, 76, 82],
        performanceB: [15, 29, 45, 62, 79, 94, 112, 128],
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        id: 'test-2',
        workspaceId: ws1,
        title: 'Emoji Engagement Analysis',
        variantA: 'Introducing our advanced row level tenant security structure.',
        variantB: 'Introducing our advanced row-level tenant security structure! 🛡️🔒 #security #saas',
        allocationA: 60,
        allocationB: 40,
        winnerCriteria: 'engagement',
        status: 'running',
        winner: 'none',
        conversionA: 1.2,
        conversionB: 2.8,
        performanceA: [5, 12, 19, 24],
        performanceB: [8, 22, 39, 58],
        createdAt: new Date(Date.now() - 3600000 * 6),
      },
    ],
  });

  // 9. Seed Shortened Links
  await prisma.shortenedLink.createMany({
    data: [
      {
        id: 'link-1',
        workspaceId: ws1,
        originalUrl: 'https://github.com/fluxora/telemetry/pull/1082',
        shortenedUrl: 'flux.ora/t-1082',
        customDomain: 'flux.ora',
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'scaling-launch',
        clicks: 842,
        retargetingPixels: {
          meta: 'px-meta-9092',
          google: 'aw-google-112',
        },
        geoClicks: { US: 450, GB: 120, DE: 82, CA: 64, IN: 126 },
        createdAt: new Date(Date.now() - 86400000 * 10),
      },
      {
        id: 'link-2',
        workspaceId: ws1,
        originalUrl: 'https://fluxora.com/jobs/senior-sre-telemetry',
        shortenedUrl: 'jobs.fluxora.com/sre-s',
        customDomain: 'jobs.fluxora.com',
        utmSource: 'linkedin',
        utmMedium: 'social',
        utmCampaign: 'sre-recruiting',
        clicks: 318,
        retargetingPixels: { linkedin: 'px-li-5541' },
        geoClicks: { US: 180, CA: 45, GB: 32, IN: 61 },
        createdAt: new Date(Date.now() - 86400000 * 4),
      },
    ],
  });

  // 10. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        id: 'log-1',
        workspaceId: ws1,
        actor: 'superadmin@fluxora.com',
        action: '2fa.enforce_global',
        timestamp: new Date(Date.now() - 3600000 * 24),
        status: 'SUCCESS',
      },
      {
        id: 'log-2',
        workspaceId: ws1,
        actor: 'manager@fluxora.com',
        action: 'digest.configure_wizard',
        timestamp: new Date(Date.now() - 3600000 * 20),
        status: 'SUCCESS',
      },
    ],
  });

  // 11. Seed Trending Topics
  await prisma.trendingTopic.createMany({
    data: [
      {
        id: 'trend-1',
        workspaceId: ws1,
        niche: 'Technology',
        topic: 'ClickHouse Query Optimizations',
        volume: 45200,
        trendRate: 24,
        historicalEngagement: 4.2,
      },
      {
        id: 'trend-2',
        workspaceId: ws1,
        niche: 'Technology',
        topic: 'Kafka Real-time Streams',
        volume: 32800,
        trendRate: 18,
        historicalEngagement: 3.9,
      },
      {
        id: 'trend-5',
        workspaceId: ws2,
        niche: 'Global Business',
        topic: 'European Data Privacy Updates',
        volume: 22000,
        trendRate: 35,
        historicalEngagement: 3.2,
      },
    ],
  });

  // 12. Seed Inbox Messages
  await prisma.inboxMessage.createMany({
    data: [
      {
        id: 'msg-1',
        workspaceId: ws1,
        platform: 'linkedin',
        type: 'comment',
        sender: 'David Chen',
        body: 'How does the Kafka fallback behavior handle partitioned queue offline events?',
        sentiment: 'neutral',
        assignedTo: 'Elena Rostova',
        timestamp: new Date(Date.now() - 3600000 * 2),
        replies: [
          {
            id: 'r-1',
            sender: 'Elena Rostova',
            body: 'We spool event batches locally to JSON log buffers before retrying the ClickHouse ingest stream!',
            timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
          },
        ],
      },
      {
        id: 'msg-2',
        workspaceId: ws1,
        platform: 'twitter',
        type: 'dm',
        sender: '@tech_growth_hub',
        body: 'Just checked out the scaling simulator, absolutely incredible performance dashboards!',
        sentiment: 'positive',
        assignedTo: 'Sarah Jenkins',
        timestamp: new Date(Date.now() - 3600000 * 4),
        replies: [],
      },
    ],
  });

  // 13. Seed Taxonomy Tags & AutoCollections
  await prisma.taxonomyTag.createMany({
    data: [
      {
        id: 'tag-1',
        workspaceId: ws1,
        name: 'clickhouse',
        color: '#8B5CF6',
        description: 'Real-time telemetry and database analytics',
      },
      {
        id: 'tag-2',
        workspaceId: ws1,
        name: 'kafka',
        color: '#3B82F6',
        description: 'Event streaming and publish-subscribe pipelines',
      },
    ],
  });

  await prisma.autoCollection.createMany({
    data: [
      {
        id: 'col-1',
        workspaceId: ws1,
        name: 'Analytical Databases',
        rules: ['tag:clickhouse'],
        matchCount: 1,
      },
    ],
  });

  // 14. Seed Topic Weights
  await prisma.topicWeight.createMany({
    data: [
      { workspaceId: ws1, category: 'Technical Architectures', weight: 45 },
      { workspaceId: ws1, category: 'Product Releases', weight: 35 },
      { workspaceId: ws1, category: 'Hiring & Culture', weight: 20 },
    ],
  });

  // 15. Seed MediaStudioItems
  await prisma.mediaStudioItem.createMany({
    data: [
      {
        id: 'm-1',
        workspaceId: ws1,
        name: 'telemetry_ingestion_chart.png',
        aspectRatios: [
          {
            ratio: '1:1',
            width: 1080,
            height: 1080,
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
          },
        ],
        focalPoint: { x: 50, y: 50 },
        watermarkPreset: 'None',
        textOverlay: '',
        audioWaveform: false,
      },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
