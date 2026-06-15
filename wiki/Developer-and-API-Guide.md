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
DATABASE_URL="postgresql://postgres:change-me-in-production@localhost:5432/fluxora_db?schema=public"
KEYCLOAK_URL="http://localhost:8081"
VAULT_URL="http://localhost:8200"
VAULT_TOKEN="fluxora-dev-token"
KAFKA_BROKERS="localhost:9092"
CLICKHOUSE_URL="http://localhost:8123"
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

All requests must pass through the API Gateway (port `8000`). The Gateway decodes the JWT and forwards the context.

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

### 2. Connected Accounts API
* **POST `/api/v1/oauth/connect`**
  * Description: Connects a platform account and writes tokens to Vault.
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
