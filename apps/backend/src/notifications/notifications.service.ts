import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';

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

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.mailFrom = this.configService.get<string>('MAIL_FROM', 'onboarding@resend.dev');

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend notification service initialized.');
    } else {
      this.logger.log('No RESEND_API_KEY configured. Running in sandbox email fallback mode.');
    }

    // Ensure sandbox directory exists
    try {
      if (!fs.existsSync(this.sandboxDir)) {
        fs.mkdirSync(this.sandboxDir, { recursive: true });
      }
    } catch (err) {
      this.logger.error(
        `Failed to create mail sandbox directory: ${err.message}`,
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<string> {
    this.logger.log(`Sending email to ${to} with subject "${subject}"...`);

    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: this.mailFrom,
          to,
          subject,
          html: htmlBody,
        });
        this.logger.log(`Email successfully sent to ${to} via Resend: ${response.data?.id}`);
        return `resend:${response.data?.id || 'sent'}`;
      } catch (err) {
        this.logger.error(`Resend API failed: ${err.message}. Appending to local mail-sandbox.`);
      }
    }

    // Local sandbox fallback
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
    } catch (err) {
      this.logger.error(`Failed to write mock email to file: ${err.message}`);
    }

    return mailFilePath;
  }
}
