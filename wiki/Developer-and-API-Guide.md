# Developer & API Guide

This guide details codebase structure, local development environment setup, and the core API endpoints.

---

## 📁 Repository Structure

Fluxora is organized as a monorepo containing a NestJS backend and a Next.js frontend:

```text
c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast/
├── apps/
│   ├── backend/
│   │   ├── prisma/             # Schema definitions and database migrations
│   │   ├── src/                # NestJS application code grouped by Domain
│   │   └── test/               # E2E integration test suites
│   └── frontend/
│       └── src/
│           ├── app/            # Next.js 15 pages and routing layout
│           └── components/     # UI components (shadcn/ui layout modules)
├── docs/                       # Technical roadmap and guidelines
├── infra/                      # Declarative configurations (Kong Gateway mapping)
├── specs/                      # Spec-Kit specifications and roadmap plans
└── docker-compose.infra.yaml   # Shared developer infrastructure
```

---

## 🛠️ Local Developer Setup

Follow these steps to set up your local development environment:

### 1. Provision Platform Services
Boot the transactional database, IAM providers, queues, event streaming brokers, and secrets store:
```bash
docker compose -f docker-compose.infra.yaml up -d
```

### 2. Configure Environment Configurations
Copy the baseline environment variables in the NestJS application:
```bash
cd apps/backend
cp .env.example .env
```
Ensure the key variables are configured:
```ini
DATABASE_URL="postgresql://postgres:change-me-in-production@localhost:54321/fluxora_db?schema=public"
KEYCLOAK_SERVER_URL="http://localhost:8081/auth"
KEYCLOAK_REALM="fluxora"
KEYCLOAK_CLIENT_ID="backend"
KEYCLOAK_CLIENT_SECRET="secret"
VAULT_URL="http://localhost:8200"
VAULT_TOKEN="fluxora-dev-token"
ENCRYPTION_KEY="57652061726520746865206368616d70696f6e73206d7920667269656e642121"
KAFKA_BROKERS="localhost:29092"
KAFKA_FALLBACK="true"
CLICKHOUSE_URL="http://localhost:8124"
CLICKHOUSE_USER="default"
CLICKHOUSE_PASSWORD=""
CLICKHOUSE_DATABASE="default"
TEMPORAL_ADDRESS="localhost:7233"
```

### 3. Initialize Prisma & PostgreSQL Migrations
Execute the database schema updates and seed files:
```bash
npx prisma migrate dev
```

### 4. Running the Applications
Start the NestJS backend API:
```bash
npm run start:dev
```
Start the Next.js frontend developer server:
```bash
cd ../frontend
npm run dev
```

---

## 🧪 Running Automated Tests

Fluxora uses Jest for backend unit and integration test suites:
```bash
# Execute Jest tests
cd apps/backend
npm run test

# Run tests with coverage reporting
npm run test:cov
```

---

## 📡 Core API Endpoints Reference

All requests must pass through the API Gateway (port `8002`). The Gateway decodes the JWT and forwards the context.

### 1. Analytics & Telemetry API
* **GET `/api/v1/analytics/performance`**
  * Description: Retrieves aggregated engagement metrics (views, clicks, shares) filtered by workspace and platform. Queries ClickHouse.
  * Headers: `Authorization: Bearer <JWT>`, `Host: <domain>`
  * Query parameters: `platform` (optional), `days` (default: 30)
* **POST `/api/v1/analytics/simulate`**
  * Description: Telemetry simulator injector. Emits a mock tracking event to Kafka.
  * Body:
    ```json
    {
      "postId": "uuid-string",
      "platform": "linkedin",
      "eventType": "post.click"
    }
    ```

### 2. Connected Accounts & OAuth API
* **POST `/api/v1/oauth/connect`**
  * Description: Connects a platform account and writes tokens to HashiCorp Vault.
  * Body:
    ```json
    {
      "provider": "linkedin",
      "code": "auth-code-returned-from-oauth-redirect"
    }
    ```

### 3. Approval Workflows API
* **POST `/api/v1/approval/:id/decision`**
  * Description: Registers client decisions (approval/rejection) from white-labeled portals.
  * URI Params: `id` (Post Variant ID or Post ID)
  * Body:
    ```json
    {
      "decision": "APPROVED", // or "REJECTED"
      "feedback": "Change the background color of the first asset image"
    }
    ```

### 4. AI & Growth OS Orchestration API
* **POST `/api/v1/ai/generate`**
  * Description: Generates personalized post copy based on user voice profiles and prompts.
  * Body: `{"prompt": "Text prompt"}`
* **POST `/api/v1/ai/runs/start`**
  * Description: Triggers a new growth optimization multi-agent loop with a specific goal and budget constraint.
  * Body: `{"goal": "Increase leads by 20%", "maxBudget": 500}`
* **GET `/api/v1/ai/runs`**
  * Description: Lists all current and historical agent runs within the active workspace.
* **GET `/api/v1/ai/runs/approvals`**
  * Description: Retrieves all active, pending human-in-the-loop approvals across agent loops.
* **POST `/api/v1/ai/runs/approve`**
  * Description: Submits approval or rejection decision for a pending agent action step.
  * Body: `{"approvalId": "uuid-string", "status": "APPROVED"}`
* **GET `/api/v1/ai/memory/search`**
  * Description: Queries the organizational memory (pgvector similarity search with ClickHouse outcomes context).
  * Query parameters: `query` (text search), `category` (`CAMPAIGN`, `CONTENT`, `EXPERIMENT`, `REVENUE`), `limit` (optional)

### 5. Webhook Automations API
* **POST `/api/v1/automations/webhooks`**
  * Description: Configures a new event webhook subscription for the workspace.
  * Body: `{"url": "https://callback.com", "eventTypes": ["post.published"], "secret": "optional-key"}`
* **GET `/api/v1/automations/webhooks`**
  * Description: Lists registered webhooks for the active workspace.
* **GET `/api/v1/automations/webhooks/logs`**
  * Description: Fetches logs of past webhooks triggers and delivery durations.

### 6. Extended Features Suite API
* **A/B Testing**
  * `GET /api/v1/extended/ab-testing/tests` — Lists A/B test experiments.
  * `POST /api/v1/extended/ab-testing/create` — Initiates A/B variant splits (`title`, `variantA`, `variantB`, `allocationA`, `allocationB`, `winnerCriteria`).
* **Link Shortening & UTM Tracking**
  * `POST /api/v1/extended/links/shorten` — Shortens URL and appends UTM parameters (`originalUrl`, `customDomain`, `utmSource`, `utmMedium`, `utmCampaign`).
  * `GET /api/v1/extended/links/list` — Lists custom links.
* **Employee Advocacy**
  * `GET /api/v1/extended/advocacy/templates` — Retrieves active sharing templates.
  * `POST /api/v1/extended/advocacy/share` — Logs an employee share action.
  * `GET /api/v1/extended/advocacy/leaderboard` — Retrieves workspace advocacy ranking scores.
* **Compliance & Security**
  * `POST /api/v1/extended/compliance/check` — Runs copies against toxic/tone validation filters.
  * `POST /api/v1/extended/compliance/security` — Updates two-factor enforcement and event retention parameters.
* **Unified Workspace Inbox**
  * `GET /api/v1/extended/inbox/messages` — Lists incoming messages across social channels.
  * `POST /api/v1/extended/inbox/reply` — Sends reply to a specific inbox message (`messageId`, `replyText`).
  * `POST /api/v1/extended/inbox/assign` — Assigns messages to specific team members (`messageId`, `assignedTo`).
* **Content Taxonomy & Media Customization**
  * `GET /api/v1/extended/taxonomy/tags` — Lists workspace taxonomy tags.
  * `POST /api/v1/extended/taxonomy/tags` — Creates taxonomy tags (`name`, `color`, `description`).
  * `POST /api/v1/extended/taxonomy/weights` — Sets category priority weights for sorting.
  * `POST /api/v1/extended/media/bulk-update` — Bulk assigns tags to media assets.
  * `POST /api/v1/extended/media/transform` — Executes focal point, watermark, or audio waveform processing.
