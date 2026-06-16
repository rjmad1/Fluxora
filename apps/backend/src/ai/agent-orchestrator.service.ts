import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../observability/kafka.service';
import { OrganizationalMemoryService } from './organizational-memory.service';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentRunState {
  id: string;
  workspaceId: string;
  goal: string;
  status:
    | 'INITIATED'
    | 'PLANNING'
    | 'PENDING_HITL'
    | 'EXECUTING'
    | 'OPTIMIZING'
    | 'COMPLETED'
    | 'FAILED';
  currentStep: string;
  budgetAllocated: number;
  decisions: Array<{
    agent: string;
    decision: string;
    details: any;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  runId: string;
  workspaceId: string;
  agentName: string;
  actionType: string;
  description: string;
  parameters: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface SandboxData {
  runs: AgentRunState[];
  approvals: ApprovalRequest[];
}

@Injectable()
export class AgentOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  private readonly filePath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'agent-orchestrator-sandbox.json',
  );

  private data: SandboxData = {
    runs: [],
    approvals: [],
  };

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly memoryService: OrganizationalMemoryService,
  ) {}

  onModuleInit() {
    this.ensureDirectoryExists();
    this.loadData();

    // Listen to inter-agent command queues in Kafka fallback mode
    this.kafkaService.registerFallbackConsumer(
      'fluxora.agents.commands',
      async (msg) => {
        await this.handleAgentCommand(msg);
      },
    );
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
          runs: parsed.runs || [],
          approvals: parsed.approvals || [],
        };
      } else {
        this.saveData();
      }
    } catch (error) {
      this.logger.error(
        'Failed to load agent orchestrator sandbox data:',
        error,
      );
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
      this.logger.error(
        'Failed to write agent orchestrator sandbox data:',
        error,
      );
    }
  }

  // Handle agent commands from Kafka queue
  private async handleAgentCommand(message: { key: string; value: string }) {
    try {
      const payload = JSON.parse(message.value);
      this.logger.log(
        `Agent Command Received: ${payload.action} for Run ${payload.runId}`,
      );
      // Process step or transition state machine
    } catch (err) {
      this.logger.error(`Failed to handle agent command: ${err.message}`);
    }
  }

  // Start a new growth coordination loop
  async startGrowthLoop(
    workspaceId: string,
    goal: string,
    maxBudget: number,
  ): Promise<AgentRunState> {
    const runId = `run-${Math.random().toString(36).substr(2, 9)}`;
    const run: AgentRunState = {
      id: runId,
      workspaceId,
      goal,
      status: 'INITIATED',
      currentStep: 'Initializing Campaign Planner Agent...',
      budgetAllocated: 0,
      decisions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.runs.push(run);
    this.saveData();

    // Trigger Campaign Planner Agent workflow
    await this.transitionState(
      runId,
      'PLANNING',
      'Campaign Planner Agent drafting campaign briefs.',
    );

    // Asynchronous Agent step simulation
    setTimeout(() => {
      this.runCampaignPlanningStep(runId, maxBudget).catch((err) =>
        this.logger.error(`Error in campaign planning step: ${err.message}`),
      );
    }, 500);

    return run;
  }

  private async runCampaignPlanningStep(runId: string, maxBudget: number) {
    const run = this.data.runs.find((r) => r.id === runId);
    if (!run) return;

    // Retrieve historical performance matching the goal from memory
    const relevantMemories = await this.memoryService.searchMemories(
      run.workspaceId,
      run.goal,
      'CAMPAIGN',
      1,
    );

    const memorySnippet =
      relevantMemories.length > 0
        ? `Based on past campaign: "${relevantMemories[0].document.metadata.title}"`
        : 'No previous campaign matches found, using base strategies.';

    run.decisions.push({
      agent: 'CampaignPlanningAgent',
      decision: 'Drafted Q3 LinkedIn & Twitter split campaign brief.',
      details: {
        budgetRecommended: maxBudget * 0.9,
        channels: ['linkedin', 'twitter'],
        rationale: memorySnippet,
      },
      timestamp: new Date().toISOString(),
    });

    // Determine if budget requires HITL Approval (e.g. > $1000)
    if (maxBudget > 1000) {
      await this.transitionState(
        runId,
        'PENDING_HITL',
        'Campaign details generated. Budget requires executive signoff.',
      );

      // Create an approval request
      const approval: ApprovalRequest = {
        id: `appr-${Math.random().toString(36).substr(2, 9)}`,
        runId,
        workspaceId: run.workspaceId,
        agentName: 'CampaignPlanningAgent',
        actionType: 'BUDGET_ALLOCATION',
        description: `Allocate $${maxBudget * 0.9} towards Q3 Campaign (Goal: ${run.goal})`,
        parameters: {
          budget: maxBudget * 0.9,
          channels: ['linkedin', 'twitter'],
        },
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      this.data.approvals.push(approval);
      this.saveData();

      // Emit command to notification stream
      await this.kafkaService.emitEvent(
        'fluxora.agents.commands',
        approval.id,
        {
          action: 'REQUIRE_APPROVAL',
          approvalId: approval.id,
          runId,
        },
      );
    } else {
      // Auto-approve and move to executing
      run.budgetAllocated = maxBudget * 0.9;
      await this.transitionState(
        runId,
        'EXECUTING',
        'Campaign execution initiated automatically.',
      );
      void this.executeCampaignStep(runId);
    }
  }

  // Handle Human-in-the-Loop decision input
  async submitApproval(
    approvalId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<ApprovalRequest> {
    const approval = this.data.approvals.find((a) => a.id === approvalId);
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found.`);
    }

    approval.status = status;
    const run = this.data.runs.find((r) => r.id === approval.runId)!;

    if (status === 'APPROVED') {
      run.budgetAllocated = approval.parameters.budget;
      await this.transitionState(
        approval.runId,
        'EXECUTING',
        `Executive approved budget allocation of $${approval.parameters.budget}. Triggering Content Operations Agent.`,
      );
      void this.executeCampaignStep(approval.runId);
    } else {
      await this.transitionState(
        approval.runId,
        'FAILED',
        'Campaign planning budget allocation was rejected by executive review.',
      );
    }

    this.saveData();
    return approval;
  }

  private async executeCampaignStep(runId: string) {
    const run = this.data.runs.find((r) => r.id === runId);
    if (!run) return;

    // Simulate content ops and publishing
    setTimeout(() => {
      const runOps = async () => {
        run.decisions.push({
          agent: 'ContentOperationsAgent',
          decision: 'Generated and published 4 campaign post variants.',
          details: {
            variantCount: 4,
            channels: ['linkedin', 'twitter'],
          },
          timestamp: new Date().toISOString(),
        });

        await this.transitionState(
          runId,
          'OPTIMIZING',
          'Content operations dispatched. Revenue Optimization Agent monitoring conversion telemetry.',
        );
        await this.optimizeCampaignStep(runId);
      };
      runOps().catch((err) =>
        this.logger.error(
          `Error in executeCampaignStep timeout: ${err.message}`,
        ),
      );
    }, 1000);
  }

  private async optimizeCampaignStep(runId: string) {
    const run = this.data.runs.find((r) => r.id === runId);
    if (!run) return;

    setTimeout(() => {
      const runOptimize = async () => {
        run.decisions.push({
          agent: 'RevenueOptimizationAgent',
          decision:
            'MAB Thompson Sampling routed 80% of traffic to LinkedIn Variant B.',
          details: {
            variantBPerformanceIncrease: '34.2%',
            costPerLeadSaved: '$4.22',
          },
          timestamp: new Date().toISOString(),
        });

        await this.transitionState(
          runId,
          'COMPLETED',
          'Campaign complete. Executive Insights Agent generating final business report.',
        );

        // Record final campaign outcome in organizational memory
        await this.memoryService.recordMemory(
          run.workspaceId,
          'REVENUE',
          `Outcome: ${run.goal}`,
          `The campaign achieved its B2B outreach target with a total spend of $${run.budgetAllocated}. Dynamic optimization routed traffic to high converting LinkedIn variants.`,
          {
            runId,
            goal: run.goal,
            budgetSpent: run.budgetAllocated,
            revenueGenerated: run.budgetAllocated * 2.8,
          },
        );
      };
      runOptimize().catch((err) =>
        this.logger.error(
          `Error in optimizeCampaignStep timeout: ${err.message}`,
        ),
      );
    }, 1000);
  }

  private async transitionState(
    runId: string,
    status: AgentRunState['status'],
    stepMessage: string,
  ) {
    const run = this.data.runs.find((r) => r.id === runId);
    if (run) {
      run.status = status;
      run.currentStep = stepMessage;
      run.updatedAt = new Date().toISOString();
      this.logger.log(`Run ${runId} transitioned to ${status}: ${stepMessage}`);
      this.saveData();
    }
  }

  async getRuns(workspaceId: string): Promise<AgentRunState[]> {
    return this.data.runs.filter((r) => r.workspaceId === workspaceId);
  }

  async getApprovals(workspaceId: string): Promise<ApprovalRequest[]> {
    return this.data.approvals.filter((a) => a.workspaceId === workspaceId);
  }
}
