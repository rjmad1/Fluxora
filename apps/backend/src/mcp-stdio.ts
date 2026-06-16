import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { McpService } from './mcp/mcp.service';
import * as readline from 'readline';

async function bootstrap() {
  // Disable standard logger output so it doesn't pollute stdout (which must only contain JSON-RPC frames)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Only log errors/warnings to stderr
  });

  const mcpService = app.get(McpService);
  const workspaceId = process.env.WORKSPACE_ID || 'ws-1';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line) => {
    void (async () => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const request = JSON.parse(trimmed);
        const response = await mcpService.handleJsonRpc(request, workspaceId);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (err: any) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: `Parse error: ${err.message}` },
            id: null,
          }) + '\n',
        );
      }
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      await app.close();
      process.exit(0);
    })();
  });
}

bootstrap().catch((err) => {
  process.stderr.write(`Failed to start stdio MCP server: ${err.message}\n`);
  process.exit(1);
});
