import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { KafkaService } from '../observability/kafka.service';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';

describe('AgentOrchestratorService', () => {
  let service: AgentOrchestratorService;

  let mockRuns: any[] = [];
  let mockApprovals: any[] = [];

  const mockKafka = {
    registerFallbackConsumer: jest.fn(),
    emitEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockMemory = {
    searchMemories: jest.fn().mockResolvedValue([]),
    recordMemory: jest.fn().mockResolvedValue({}),
  };

  const mockPrisma = {
    agentRunState: {
      create: jest.fn().mockImplementation(({ data }) => {
        const run = {
          id: `run-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: data.workspaceId,
          goal: data.goal,
          status: data.status,
          currentStep: data.currentStep,
          budgetAllocated: data.budgetAllocated,
          decisions: data.decisions || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockRuns.push(run);
        return Promise.resolve(run);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const run = mockRuns.find((r) => r.id === where.id);
        if (run) {
          Object.assign(run, data);
          run.updatedAt = new Date();
          return Promise.resolve(run);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const run = mockRuns.find((r) => r.id === where.id);
        return Promise.resolve(run || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockRuns.filter((r) => r.workspaceId === where.workspaceId),
        );
      }),
    },
    approvalRequest: {
      create: jest.fn().mockImplementation(({ data }) => {
        const app = {
          id: `appr-${Math.random().toString(36).substr(2, 9)}`,
          runId: data.runId,
          workspaceId: data.workspaceId,
          agentName: data.agentName,
          actionType: data.actionType,
          description: data.description,
          parameters: data.parameters || {},
          status: data.status,
          createdAt: new Date(),
        };
        mockApprovals.push(app);
        return Promise.resolve(app);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const app = mockApprovals.find((a) => a.id === where.id);
        if (app) {
          Object.assign(app, data);
          return Promise.resolve(app);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const app = mockApprovals.find((a) => a.id === where.id);
        return Promise.resolve(app || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          mockApprovals.filter((a) => a.workspaceId === where.workspaceId),
        );
      }),
    },
  };

  const mockTenant = {};
  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => defaultVal),
  };

  beforeEach(async () => {
    mockRuns = [];
    mockApprovals = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentOrchestratorService,
        { provide: KafkaService, useValue: mockKafka },
        { provide: OrganizationalMemoryService, useValue: mockMemory },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantService, useValue: mockTenant },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AgentOrchestratorService>(AgentOrchestratorService);
    service.onModuleInit();
  });

  it('should start a new agent execution loop and transition to planning state', async () => {
    const run = await service.startGrowthLoop(
      'ws-agent-test',
      'Grow leads by 10%',
      500,
    );

    expect(run).toBeDefined();
    expect(run.status).toBe('PLANNING');
    expect(run.goal).toBe('Grow leads by 10%');

    const runs = await service.getRuns('ws-agent-test');
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe(run.id);
  });

  it('should request human approval for high budget campaigns', async () => {
    const run = await service.startGrowthLoop(
      'ws-agent-test',
      'Big Enterprise Push',
      5000,
    );

    expect(run).toBeDefined();

    // Wait for async planner step
    await new Promise((resolve) => setTimeout(resolve, 600));

    const runs = await service.getRuns('ws-agent-test');
    expect(runs[0].status).toBe('PENDING_HITL');

    const approvals = await service.getApprovals('ws-agent-test');
    expect(approvals).toHaveLength(1);
    expect(approvals[0].actionType).toBe('BUDGET_ALLOCATION');
    expect(approvals[0].parameters.budget).toBe(4500); // 90% of maxBudget

    // Approve the budget and check execution transition
    await service.submitApproval(approvals[0].id, 'APPROVED');

    const updatedRuns = await service.getRuns('ws-agent-test');
    expect(updatedRuns[0].status).toBe('EXECUTING');
    expect(updatedRuns[0].budgetAllocated).toBe(4500);
  });
});
