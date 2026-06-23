import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../tenant/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sandboxDir = path.join(
    process.cwd(),
    'logs',
    'mail-sandbox',
  );
  private resend: Resend | null = null;
  private mailFrom = 'onboarding@resend.dev';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue('webhook-delivery') private readonly webhookQueue: Queue,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      'onboarding@resend.dev',
    );

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend notification service initialized.');
    } else {
      this.logger.log(
        'No RESEND_API_KEY configured. Running in sandbox email fallback mode.',
      );
    }

    // Ensure sandbox directory exists
    try {
      if (!fs.existsSync(this.sandboxDir)) {
        fs.mkdirSync(this.sandboxDir, { recursive: true });
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to create mail sandbox directory: ${err.message}`,
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    workspaceId?: string,
  ): Promise<string> {
    this.logger.log(`Sending email to ${to} with subject "${subject}"...`);

    // 1. Resolve workspace custom SMTP if provided
    let customSmtp: any = null;
    if (workspaceId) {
      try {
        const settings = await this.prisma.workspaceSettings.findUnique({
          where: { workspaceId },
        });
        if (settings && settings.smtpConfig) {
          customSmtp = settings.smtpConfig;
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to fetch workspace custom SMTP configuration: ${err.message}`,
        );
      }
    }

    if (customSmtp) {
      try {
        this.logger.log(
          `Using custom SMTP config for workspace ${workspaceId}: ${customSmtp.host}`,
        );
        const transporter = nodemailer.createTransport({
          host: customSmtp.host,
          port: Number(customSmtp.port) || 587,
          secure: customSmtp.secure ?? false,
          auth: {
            user: customSmtp.user,
            pass: customSmtp.pass,
          },
        });

        const info = await transporter.sendMail({
          from: customSmtp.fromEmail || this.mailFrom,
          to,
          subject,
          html: htmlBody,
        });

        this.logger.log(
          `Email successfully sent to ${to} via custom SMTP: ${info.messageId}`,
        );
        return `smtp:${info.messageId}`;
      } catch (smtpErr: any) {
        this.logger.error(
          `Custom SMTP dispatch failed: ${smtpErr.message}. Falling back to default mailer.`,
        );
      }
    }

    // 2. Fallback to default Resend API
    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: this.mailFrom,
          to,
          subject,
          html: htmlBody,
        });
        this.logger.log(
          `Email successfully sent to ${to} via Resend: ${response.data?.id}`,
        );
        return `resend:${response.data?.id || 'sent'}`;
      } catch (err: any) {
        this.logger.error(
          `Resend API failed: ${err.message}. Appending to local mail-sandbox.`,
        );
      }
    }

    // 3. Fallback to local file sandbox
    const mailFileName = `mail-${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    const mailFilePath = path.join(this.sandboxDir, mailFileName);

    const fileContent = `
<!-- Sent: ${new Date().toISOString()} -->
<!-- To: ${to} -->
<!-- Subject: ${subject} -->
<hr />
${htmlBody}
`;

    try {
      fs.writeFileSync(mailFilePath, fileContent.trim(), 'utf-8');
      this.logger.log(`Mock email written to sandbox file: ${mailFilePath}`);
    } catch (err: any) {
      this.logger.error(`Failed to write mock email to file: ${err.message}`);
    }

    return mailFilePath;
  }

  async dispatchWebhook(
    workspaceId: string,
    eventType: string,
    payload: any,
  ): Promise<void> {
    try {
      const subscriptions = await this.prisma.webhookSubscription.findMany({
        where: {
          workspaceId,
          active: true,
          eventTypes: {
            has: eventType,
          },
        },
      });

      if (subscriptions.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${subscriptions.length} active webhook subscription(s) for event ${eventType} in workspace ${workspaceId}. Queueing delivery jobs.`,
      );

      for (const sub of subscriptions) {
        await this.webhookQueue.add(
          'dispatch-webhook',
          {
            subscriptionId: sub.id,
            workspaceId,
            eventType,
            payload,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }
    } catch (err: any) {
      this.logger.error(`Webhook query/dispatch failed: ${err.message}`);
    }
  }
}
