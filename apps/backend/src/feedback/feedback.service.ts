import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../tenant/prisma.service';

export class CreateFeedbackDto {
  type: 'BUG' | 'FEATURE';
  title: string;
  description: string;
  url: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata: any;
  screenshot?: string | null;
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Save feedback record
  async createFeedback(dto: CreateFeedbackDto, workspaceId: string) {
    this.logger.log(
      `Received feedback report type ${dto.type}: "${dto.title}"`,
    );

    const report = await this.prisma.feedbackReport.create({
      data: {
        workspaceId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        url: dto.url,
        metadata: dto.metadata || {},
        screenshotUrl: dto.screenshot || null,
        status: 'OPEN',
        priority: dto.priority || 'MEDIUM',
      },
    });

    // Fire asynchronous background triage processing
    // In production, this can emit to Kafka or BullMQ queue
    this.triggerAutoTriage(report.id).catch((err) =>
      this.logger.error(
        `Feedback triage failed for report ${report.id}: ${err.message}`,
      ),
    );

    return {
      message: 'Feedback successfully received and queued for triage.',
      reportId: report.id,
      status: report.status,
    };
  }

  // Retrieve feedback history for developer dashboard/analytics
  async getFeedbackReports(workspaceId: string) {
    return this.prisma.feedbackReport.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Simulated auto-triage using LLM classifier
  private async triggerAutoTriage(reportId: string) {
    this.logger.log(
      `Queuing auto-triage classification for report: ${reportId}`,
    );

    // Simulate AI pipeline delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const report = await this.prisma.feedbackReport.findUnique({
      where: { id: reportId },
    });
    if (!report) return;

    // AI logic analyzes files, assigns priority, and updates status
    let autoPriority = report.priority;
    if (
      report.description.toLowerCase().includes('crash') ||
      report.description.toLowerCase().includes('leak')
    ) {
      autoPriority = 'CRITICAL';
    } else if (
      report.description.toLowerCase().includes('fail') ||
      report.description.toLowerCase().includes('error')
    ) {
      autoPriority = 'HIGH';
    }

    await this.prisma.feedbackReport.update({
      where: { id: reportId },
      data: {
        status: 'TRIAGED',
        priority: autoPriority,
      },
    });

    this.logger.log(
      `Auto-triage completed for ${reportId}. Priority resolved to ${autoPriority}.`,
    );
  }
}
