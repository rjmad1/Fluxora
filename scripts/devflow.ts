import { spawn, execSync } from 'child_process';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';

// ANSI Colors for Premium Terminal UI
const BLUE = '\x1b[94m\x1b[1m';
const GREEN = '\x1b[92m\x1b[1m';
const YELLOW = '\x1b[93m\x1b[1m';
const RED = '\x1b[91m\x1b[1m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printBanner() {
  console.log(`
${BLUE}██████╗ ███████╗██╗   ██╗███████╗██╗      ██████╗ ██╗    ██╗
██╔══██╗██╔════╝██║   ██║██╔════╝██║     ██╔═══██╗██║    ██║
██║  ██║█████╗  ██║   ██║█████╗  ██║     ██║   ██║██║ ╚═╗ ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║██║ ██║ ██║
██████╔╝███████╗ ╚████╔╝ ██║     ███████╗╚██████╔╝╚██████╔╝██║
╚═════╝ ╚══════╝  ╚═══╝  ╚═╝     ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝${RESET}
            ${BOLD}Fluxora DevFlow CLI Orchestrator${RESET}
`);
}

// Check if a local TCP port is in use
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// Execute command and capture output string
function runCmdSync(cmd: string, cwd = process.cwd()): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error: any) {
    return '';
  }
}

// Pause non-critical infrastructure containers to save memory
function pauseInfrastructure() {
  console.log(`${YELLOW}Pausing heavy infrastructure resources (Keycloak, ClickHouse, Kafka, Vault, Redis)...${RESET}`);
  try {
    execSync('docker compose -f docker-compose.infra.yaml pause keycloak clickhouse kafka vault redis', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`${GREEN}✓ Resources hibernated successfully. Running on PostgreSQL-only low-power mode.${RESET}`);
  } catch (err: any) {
    console.log(`${RED}Failed to pause resources: ${err.message}${RESET}`);
  }
}

// Unpause all infrastructure containers
function resumeInfrastructure() {
  console.log(`${GREEN}Resuming all infrastructure resources (unpausing Keycloak, ClickHouse, Kafka, Vault, Redis)...${RESET}`);
  try {
    execSync('docker compose -f docker-compose.infra.yaml unpause keycloak clickhouse kafka vault redis', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`${GREEN}✓ Resources unpaused and healthy.${RESET}`);
  } catch (err: any) {
    console.log(`${RED}Failed to resume resources: ${err.message}. They might not be started yet.${RESET}`);
  }
}

// Startup orchestrator flow
async function startDevFlow() {
  printBanner();
  
  console.log(`${BLUE}[1/4] Scanning local workspace dependencies...${RESET}`);
  const backendPkg = require('../apps/backend/package.json');
  const frontendPkg = require('../apps/frontend/package.json');
  console.log(`  - Backend detected: NestJS v${backendPkg.dependencies['@nestjs/core']}`);
  console.log(`  - Frontend detected: Next.js v${frontendPkg.dependencies['next']}`);

  console.log(`\n${BLUE}[2/4] Initializing infrastructure databases...${RESET}`);
  // Start docker-compose databases (we start everything up-front, then pause the non-critical ones)
  console.log('Spinning up Docker Compose containers...');
  try {
    execSync('docker compose -f docker-compose.infra.yaml up -d', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`${GREEN}✓ Docker containers running.${RESET}`);
  } catch (err: any) {
    console.log(`${RED}Docker Compose startup failed. Ensure Docker Desktop is running: ${err.message}${RESET}`);
    process.exit(1);
  }

  // Pause heavy nodes by default for resource efficiency
  pauseInfrastructure();

  console.log(`\n${BLUE}[3/4] Allocating environment ports (checking collisions)...${RESET}`);
  const backendPort = 3000;
  const frontendPort = 3001;

  const isBackendBusy = await isPortInUse(backendPort);
  if (isBackendBusy) {
    console.log(`${YELLOW}Warning: Default Backend port ${backendPort} is occupied. Please ensure other local NestJS servers are stopped.${RESET}`);
  }

  const isFrontendBusy = await isPortInUse(frontendPort);
  if (isFrontendBusy) {
    console.log(`${YELLOW}Warning: Default Frontend port ${frontendPort} is occupied. Next.js will automatically select the next available port.${RESET}`);
  }

  console.log(`\n${BLUE}[4/4] Launching Workspace application services...${RESET}`);
  
  // Spawn backend NestJS dev server
  console.log(`${BOLD}Launching NestJS Backend on http://localhost:${backendPort}...${RESET}`);
  const backendProcess = spawn('npm', ['run', 'dev:backend'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Spawn frontend Next.js dev server
  console.log(`${BOLD}Launching Next.js Frontend on http://localhost:${frontendPort}...${RESET}`);
  const frontendProcess = spawn('npm', ['run', 'dev:frontend', '--', '--port', frontendPort.toString()], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Handle process termination cleanly
  const exitHandler = () => {
    console.log(`\n${YELLOW}DevFlow: Stopping active services cleanly...${RESET}`);
    try {
      backendProcess.kill();
      frontendProcess.kill();
    } catch (e) {}
    
    // Resume containers so we can shut them down cleanly or leave them running in standard state
    try {
      execSync('docker compose -f docker-compose.infra.yaml unpause', { stdio: 'ignore' });
      execSync('docker compose -f docker-compose.infra.yaml stop', { stdio: 'inherit' });
      console.log(`${GREEN}✓ Docker containers stopped.${RESET}`);
    } catch (e) {}
    
    process.exit(0);
  };

  process.on('SIGINT', exitHandler);
  process.on('SIGTERM', exitHandler);
}

// Display devflow system status
function displayStatus() {
  printBanner();
  console.log(`${BOLD}--- Infrastructure Container Status ---${RESET}`);
  const psOutput = runCmdSync('docker compose -f docker-compose.infra.yaml ps');
  console.log(psOutput || `${YELLOW}No active DevFlow containers detected.${RESET}`);

  console.log(`\n${BOLD}--- Port In-Use Status ---${RESET}`);
  isPortInUse(3000).then(inUse => console.log(`  - Port 3000 (Backend API):  ${inUse ? GREEN + 'BUSY' : YELLOW + 'FREE'}${RESET}`));
  isPortInUse(3001).then(inUse => console.log(`  - Port 3001 (Next.js UI):   ${inUse ? GREEN + 'BUSY' : YELLOW + 'FREE'}${RESET}`));
}

// CLI Routing entrypoint
const command = process.argv[2] || 'start';

switch (command) {
  case 'start':
    startDevFlow();
    break;
  case 'pause':
    pauseInfrastructure();
    break;
  case 'resume':
    resumeInfrastructure();
    break;
  case 'status':
    displayStatus();
    break;
  case 'stop':
    console.log(`${YELLOW}Stopping DevFlow environment...${RESET}`);
    try {
      execSync('docker compose -f docker-compose.infra.yaml unpause', { stdio: 'ignore' });
      execSync('docker compose -f docker-compose.infra.yaml stop', { stdio: 'inherit' });
      console.log(`${GREEN}✓ Environment stopped successfully.${RESET}`);
    } catch (err: any) {
      console.log(`${RED}Error stopping environment: ${err.message}${RESET}`);
    }
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Usage: npx ts-node scripts/devflow.ts [start|stop|pause|resume|status]');
}
