import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantInterceptor } from '../tenant/tenant.interceptor';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/v1/notifications')
@UseInterceptors(TenantInterceptor)
export class NotificationsController {
  private readonly sandboxDir = path.join(
    process.cwd(),
    'logs',
    'mail-sandbox',
  );

  @Get('mail-sandbox')
  async getMailSandbox() {
    try {
      if (!fs.existsSync(this.sandboxDir)) {
        return [];
      }
      const files = fs.readdirSync(this.sandboxDir);
      const emails = files
        .filter((file) => file.endsWith('.html'))
        .map((file) => {
          const filePath = path.join(this.sandboxDir, file);
          const stat = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf8');

          // Parse headers from HTML content if we stored them
          // <!-- Sent: ... -->
          // <!-- To: ... -->
          // <!-- Subject: ... -->
          const sentMatch = content.match(/<!-- Sent: (.*?) -->/);
          const toMatch = content.match(/<!-- To: (.*?) -->/);
          const subjectMatch = content.match(/<!-- Subject: (.*?) -->/);

          return {
            filename: file,
            createdAt: stat.birthtime.toISOString(),
            sentAt: sentMatch ? sentMatch[1] : stat.mtime.toISOString(),
            to: toMatch ? toMatch[1] : 'unknown',
            subject: subjectMatch ? subjectMatch[1] : 'No Subject',
          };
        });

      // Sort by creation time descending
      return emails.sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to retrieve email sandbox: ${err.message}`,
      );
    }
  }

  @Get('mail-sandbox/:filename')
  async getMailContent(@Param('filename') filename: string) {
    // Basic path traversal prevention
    const safeFilename = path.basename(filename);
    if (!safeFilename.endsWith('.html')) {
      throw new BadRequestException('Invalid filename extension');
    }

    const filePath = path.join(this.sandboxDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Email sandbox file ${safeFilename} not found`,
      );
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        content,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to read email sandbox file: ${err.message}`,
      );
    }
  }
}
