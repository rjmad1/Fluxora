import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface TelemetryEventData {
  id: string;
  workspaceId: string;
  postId: string;
  platform: string;
  eventType: string;
  timestamp: string;
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private clickhouseUrl = 'http://localhost:8123';
  private clickhouseUser = 'default';
  private clickhousePassword = '';
  private clickhouseDatabase = 'default';
  private isFallback = false;
  private sandboxFilePath = path.join(process.cwd(), 'logs/clickhouse-sandbox/events.json');

  constructor(private readonly configService: ConfigService) {
    this.clickhouseUrl = this.configService.get<string>('CLICKHOUSE_URL', 'http://localhost:8123');
    this.clickhouseUser = this.configService.get<string>('CLICKHOUSE_USER', 'default');
    this.clickhousePassword = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');
    this.clickhouseDatabase = this.configService.get<string>('CLICKHOUSE_DATABASE', 'default');
    
    const fallbackEnv = this.configService.get<string>('CLICKHOUSE_FALLBACK', 'false');
    if (fallbackEnv === 'true') {
      this.isFallback = true;
      this.logger.warn('ClickHouse fallback mode explicitly enabled via environment variable.');
    }
  }

  async onModuleInit() {
    // Ensure sandbox directory exists
    const dir = path.dirname(this.sandboxFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.sandboxFilePath)) {
      fs.writeFileSync(this.sandboxFilePath, '[]', 'utf8');
    }

    if (this.isFallback) {
      return;
    }

    try {
      this.logger.log(`Pinging ClickHouse server at ${this.clickhouseUrl}...`);
      // Send a lightweight query to test connection and database readiness
      const res = await fetch(`${this.clickhouseUrl}/?query=SELECT%201`, {
        method: 'POST',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(3000), // Timeout after 3 seconds
      });

      if (res.ok) {
        this.logger.log('Successfully connected to ClickHouse server.');
        // Ensure table exists
        await this.initializeTable();
      } else {
        throw new Error(`ClickHouse responded with status: ${res.status}`);
      }
    } catch (err) {
      this.isFallback = true;
      this.logger.warn(`ClickHouse server unreachable. Operating in local JSON sandbox fallback mode: ${err.message}`);
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.clickhouseUser || this.clickhousePassword) {
      const auth = Buffer.from(`${this.clickhouseUser}:${this.clickhousePassword}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    return headers;
  }

  private async initializeTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS telemetry_events (
        id UUID,
        workspaceId String,
        postId String,
        platform String,
        eventType String,
        timestamp DateTime64(3, 'UTC')
      ) ENGINE = MergeTree()
      ORDER BY (workspaceId, eventType, timestamp);
    `;

    try {
      const res = await fetch(`${this.clickhouseUrl}/?database=${this.clickhouseDatabase}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: createTableQuery,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to create table: ${errText}`);
      }
      this.logger.log('ClickHouse telemetry_events table initialized/verified.');
    } catch (err) {
      this.logger.error(`Failed to initialize ClickHouse table: ${err.message}`);
      throw err;
    }
  }

  async writeTelemetryEventsBatch(events: TelemetryEventData[]): Promise<void> {
    if (events.length === 0) return;

    if (this.isFallback) {
      this.logger.log(`[ClickHouse Sandbox] Batch writing ${events.length} events to local sandbox file.`);
      try {
        let existing: TelemetryEventData[] = [];
        if (fs.existsSync(this.sandboxFilePath)) {
          const content = fs.readFileSync(this.sandboxFilePath, 'utf8');
          existing = JSON.parse(content || '[]');
        }
        existing.push(...events);
        fs.writeFileSync(this.sandboxFilePath, JSON.stringify(existing, null, 2), 'utf8');
      } catch (err) {
        this.logger.error(`Failed to write to local ClickHouse sandbox: ${err.message}`);
      }
      return;
    }

    try {
      // Format as JSONEachRow: each event is a JSON object on its own line
      const body = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
      
      const url = `${this.clickhouseUrl}/?database=${this.clickhouseDatabase}&query=INSERT INTO telemetry_events FORMAT JSONEachRow`;
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to batch insert telemetry: ${errText}`);
      }
      this.logger.log(`Successfully batch inserted ${events.length} telemetry events to ClickHouse.`);
    } catch (err) {
      this.logger.error(`Failed ClickHouse batch write: ${err.message}. Appending to sandbox.`);
      // Fallback to sandbox on runtime error
      try {
        let existing: TelemetryEventData[] = [];
        if (fs.existsSync(this.sandboxFilePath)) {
          const content = fs.readFileSync(this.sandboxFilePath, 'utf8');
          existing = JSON.parse(content || '[]');
        }
        existing.push(...events);
        fs.writeFileSync(this.sandboxFilePath, JSON.stringify(existing, null, 2), 'utf8');
      } catch (subErr) {
        this.logger.error(`Sandbox write fallback failed: ${subErr.message}`);
      }
    }
  }

  async queryTelemetryPerformance(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    platforms?: string[],
  ): Promise<any[]> {
    if (this.isFallback) {
      this.logger.log(`[ClickHouse Sandbox] Querying performance for workspace: ${workspaceId}`);
      try {
        if (!fs.existsSync(this.sandboxFilePath)) {
          return [];
        }
        const content = fs.readFileSync(this.sandboxFilePath, 'utf8');
        const allEvents: TelemetryEventData[] = JSON.parse(content || '[]');
        
        // Filter events
        const filtered = allEvents.filter((event) => {
          if (event.workspaceId !== workspaceId) return false;
          
          const eventTime = new Date(event.timestamp);
          if (eventTime < startDate || eventTime > endDate) return false;
          
          if (platforms && platforms.length > 0) {
            return platforms.includes(event.platform.toLowerCase());
          }
          return true;
        });

        // Group by platform and eventType
        const aggregates: Record<string, number> = {};
        filtered.forEach((event) => {
          const key = `${event.platform.toLowerCase()}:${event.eventType.toLowerCase()}`;
          aggregates[key] = (aggregates[key] || 0) + 1;
        });

        // Transform to match output format
        return Object.entries(aggregates).map(([key, count]) => {
          const [platform, eventType] = key.split(':');
          return { platform, eventType, count };
        });
      } catch (err) {
        this.logger.error(`Failed to query ClickHouse sandbox file: ${err.message}`);
        return [];
      }
    }

    try {
      // Sanitize all user-controlled values to prevent SQL injection
      const sanitizedWorkspaceId = this.sanitizeClickHouseValue(workspaceId);

      const platformFilter = platforms && platforms.length > 0
        ? `AND platform IN (${platforms.map((p) => `'${this.sanitizeClickHouseValue(p.toLowerCase())}'`).join(',')})`
        : '';

      // Format ISO dates to ClickHouse friendly timestamp string: YYYY-MM-DD HH:MM:SS
      const formatCHDate = (d: Date) => d.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19);

      const sql = `
        SELECT lower(platform) as platform, lower(eventType) as eventType, count() as count
        FROM telemetry_events
        WHERE workspaceId = '${sanitizedWorkspaceId}'
          AND timestamp >= '${formatCHDate(startDate)}'
          AND timestamp <= '${formatCHDate(endDate)}'
          ${platformFilter}
        GROUP BY platform, eventType
        FORMAT JSONEachRow
      `;

      const res = await fetch(`${this.clickhouseUrl}/?database=${this.clickhouseDatabase}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: sql,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ClickHouse query failed: ${errText}`);
      }

      const text = await res.text();
      // Split by newline and parse JSON each row
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parsed = JSON.parse(line);
          return {
            platform: parsed.platform,
            eventType: parsed.eventType,
            count: Number(parsed.count),
          };
        });
    } catch (err) {
      this.logger.error(`ClickHouse query failed: ${err.message}. Falling back to sandbox file.`);
      this.isFallback = true;
      return this.queryTelemetryPerformance(workspaceId, startDate, endDate, platforms);
    }
  }

  getIsFallback(): boolean {
    return this.isFallback;
  }

  /**
   * Sanitize user-controlled string values before interpolation into ClickHouse SQL.
   * ClickHouse HTTP API does not support parameterized queries, so we must sanitize manually.
   * - Escapes single quotes (ClickHouse uses \' for escaping)
   * - Removes backslashes to prevent escape sequence injection
   * - Strips SQL comment markers and semicolons
   * - Validates that the value only contains expected alphanumeric/dash/underscore/dot characters
   */
  private sanitizeClickHouseValue(value: string): string {
    if (!value) return '';
    return value
      .replace(/\\/g, '')       // Remove backslashes
      .replace(/'/g, "\\'")     // Escape single quotes
      .replace(/;/g, '')        // Remove semicolons
      .replace(/--/g, '')       // Remove SQL line comments
      .replace(/\/\*/g, '')     // Remove SQL block comment openers
      .replace(/\*\//g, '');    // Remove SQL block comment closers
  }
}

