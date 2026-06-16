import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { KafkaService } from '../observability/kafka.service';
import { OrganizationalMemoryService } from './organizational-memory.service';
import { PrismaService } from '../tenant/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

describe('AgentOrchestratorService', () => {
  let service: AgentOrchestratorService;
  const sandboxPath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'agent-orchestrator-sandbox.json',
  );

  const mockKafka = {
    registerFallbackConsumer: jest.fn(),
    emitEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockMemory = {
    searchMemories: jest.fn().mockResolvedValue([]),
    recordMemory: jest.fn().mockResolvedValue({}),
  };

  const mockPrisma = {};
  const mockTenant = {};
  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultVal) => defaultVal),
  };

  beforeEach(async () => {
    // Clear sandbox
    if (fs.existsSync(sandboxPath)) {
      try {
        fs.unlinkSync(sandboxPath);
      } catch (err) {
        // ignore if file does not exist or cannot be deleted
      }
    }

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
