# Fluxora: Social Media Blast — Architecture, Product & Engineering Execution Roadmap
*Transforming the Postiz Codebase into an Enterprise-Grade, Workflow-Centric Digital Distribution Platform*

---

## 1. Executive Summary

### 1.1 Strategic Vision & Business Alignment
Fluxora: Social Media Blast is positioned not merely as a social scheduler, but as the central nervous system of brand distribution. The primary objective is to collapse the friction between omnichannel content composition, programmatic scheduling, asset transcoding, and analytics feedback. 

Our beachhead segment is **Digital Marketing Agencies**. These organizations manage dozens of clients (requiring logical multi-tenant workspace isolation), schedule high-volume organic distribution loops (requiring publishing reliability and rate-limit mitigation), and operate manual review cycles (requiring client-facing white-labeled portals). By serving this beachhead, Fluxora taps into immediate referral networks that expand our reach to hundreds of enterprise brands.

### 1.2 The Postiz Codebase as a Core Accelerator
To meet aggressive timeline commitments without sacrificing architectural integrity, Fluxora rejects greenfield development. Instead, we follow a strict **Adopt → Extend → Wrap → Fork → Build** governance model. 

The existing **Postiz codebase (postiz-app)** serves as our primary accelerator. Specifically:
* **Adopt & Wrap**: We harvest the underlying **social network integration providers** (adapters for LinkedIn, Facebook, Instagram, TikTok, X, Pinterest, YouTube, etc.) located in `libraries/nestjs-libraries/src/integrations/social/*`.
* **Refactor & Extend**: We migrate Postiz's monorepo structure from a mixed NestJS/Next.js setup into a robust microservices monorepo. We refactor the transactional database schema to support strict multi-tenant workspace partitioning, and move token storage into HashiCorp Vault.
* **Build New**: We construct only our proprietary differentiators: the *Distribution Intelligence Engine*, the *Agency Operating System*, the *Content Adaptation Engine*, the *AI Content Operations*, the *Analytics Intelligence Layer*, and the *Multi-Tenant Governance Engine*.

### 1.3 Core Architectural Governance Metrics
* **Overall Code Reuse Score**: **32%** (focused on third-party social provider APIs and asset structures).
* **Refactor Score**: **38%** (focused on separating workspace metadata, wrapping social providers in Temporal, and vaulting OAuth flows).
* **Replace Score**: **15%** (replacing custom Auth with Keycloak, BullMQ with Temporal, and plain PostgreSQL columns with HashiCorp Vault).
* **Build-New Score**: **15%** (client approval portals, Kafka-ClickHouse analytical pipeline, AI policy compliance engines).

---

## 2. Requirement Traceability Matrix (RTM)

This matrix maps the requirements defined in the Phase 1 PRD and Platform Architecture specification to existing Postiz capabilities, target adopted infrastructure, and required refactoring/building efforts.

| Req ID | Requirement Description | Category | Postiz Capability | Target Adoption / Solution | Gap Severity | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Multi-tenant isolation at DB & Event levels | Security | Partial (Organization model only) | Row-Level Security (RLS) + Workspace Partitioning in PostgreSQL | High | **Refactor**: Redesign schema to enforce `tenant_id` and `workspace_id` globally. |
| **FR-002** | Keycloak Integration for IAM & SSO | Security | None (Custom cookies/session auth) | **Adopt**: Keycloak + NestJS Keycloak Connect SDK | High | **Replace**: Deprecate Postiz auth; delegate identity to Keycloak. |
| **FR-003** | Tenant Onboarding Flow | Functional | Simple SignUp / Invite | **Adopt**: NestJS workspace initialization triggered by Keycloak webhook events. | Medium | **Extend**: Integrate Keycloak user creation with local db sync. |
| **FR-004** | OAuth Connection & Secure Token Storage | Security | Direct DB storage (Encrypted columns) | **Adopt**: HashiCorp Vault for OAuth tokens; PostgreSQL stores metadata references. | High | **Refactor**: Intercept token writes and route them to Vault engine. |
| **FR-005** | Token Lifecycle & Auto-Refresh | Technical | Basic cron scheduler | **Adopt**: Temporal workflows for token refresh; event-driven alerts. | Medium | **Wrap**: Wrap provider refresh methods inside Temporal workflow activities. |
| **FR-006** | Omnichannel Social Network Adapters | Functional | Yes (Bluesky, Dev.to, FB, IG, LinkedIn, X, TikTok, YT, Reddit, etc.) | **Reuse**: Social providers in `libraries/nestjs-libraries/src/integrations/social` | Low | **Reuse & Wrap**: Decouple providers from NestJS controllers; wrap in Temporal activity layer. |
| **FR-007** | Omnichannel Unified Composer | Functional | Single textarea with simple platform tabs | **Refactor**: Next.js 15 UI with side-by-side Previews, character counts, and channel-specific overrides. | Medium | **Refactor**: Rebuild Postiz composer with dynamic per-platform override schemas. |
| **FR-008** | S3/MinIO DAM Library | Functional | Basic file upload to S3/local | **Adopt**: MinIO (local dev) / AWS S3 + metadata tags database. | Low | **Extend**: Add search indexes and category tagging to asset table. |
| **FR-009** | Asset Transcoding Pipeline (FFmpeg & Sharp) | Technical | Image upload processing | **Adopt**: Sharp (image variants) + FFmpeg (video transcoding) wrapped in Temporal. | Medium | **Extend**: Delegate asset processing from backend server to isolated worker containers. |
| **FR-010** | Durable Execution & Scheduling | Technical | BullMQ (Redis) queues | **Adopt**: Temporal Workflow Engine for publishing states and retries. | High | **Replace**: Deprecate plain BullMQ cron; implement Temporal Workflow scheduler. |
| **FR-011** | Staggering & Rate-Limit Handling | Technical | Simple Redis retry loops | **Build**: *Distribution Intelligence Engine* (anti-ban staggering, dynamic IP routing). | High | **Build New**: Deploy dynamic retry backoffs and IP proxy routing plugin. |
| **FR-012** | Client Approval Workflow Portal | Functional | None | **Build**: *Agency Operating System* (external client portal, tokenized link access). | Critical | **Build New**: Develop white-labeled client approval portal. |
| **FR-013** | Telemetry & Ingestion Analytics | Technical | Basic DB aggregation queries | **Adopt**: Apache Kafka for streaming; ClickHouse for time-series analytics. | High | **Replace**: Extract post metrics via OTel collector into Kafka/ClickHouse. |
| **FR-014** | Brand Policy Compliance & LLM Router | Technical | Simple OpenAI text generation | **Adopt**: OpenAI/Gemini/Anthropic wrapped in LangGraph + LLM Router. | Medium | **Extend**: Integrate LLM validation filters before scheduling. |
| **FR-015** | White-Labeled Custom Domains | Functional | None | **Adopt**: Kong API Gateway dynamic host mapping / dynamic Traefik routing. | Medium | **Adopt**: Configure dynamic gateway routing headers based on Host headers. |
| **FR-016** | Audits & Governance Trails | Security | None | **Adopt**: Apache Kafka to stream audit logs to PostgreSQL audit partition. | Medium | **Build New**: Outbox-pattern audit log interceptor in NestJS. |
| **FR-017** | Observability (OpenTelemetry) | Operations | None | **Adopt**: OpenTelemetry Collector, Prometheus, Grafana, Loki | Low | **Adopt**: Instrument services with NestJS OTel middleware. |

---

## 3. Postiz Architectural Assessment

Exhaustive code due-diligence of the baseline Postiz codebase reveals the following properties:

### 3.1 Repository Structure
* **Current State**: Postiz is organized as an Nx/Pnpm monorepo. It contains `apps/backend` (NestJS REST API), `apps/frontend` (Next.js client), `apps/orchestrator` (BullMQ workers), and `libraries/nestjs-libraries` (shared Prisma client, integration adapters, email services).
* **Technical Strengths**: Excellent packaging boundaries using Nx. Highly modular shared library architecture. The `nestjs-libraries` directory separates the core database, services, and third-party API adapters cleanly.
* **Technical Weaknesses & Debt**: Mixed dependencies across frontend and backend in shared packages. Tight coupling of Prisma models to local database controllers, making schema refactoring risky.

### 3.2 Backend Architecture & API Layer
* **Current State**: NestJS with standard controller-service patterns. Communication between the API gateway and workers relies on Redis/BullMQ.
* **Technical Strengths**: Clean Dependency Injection, extensive use of decorators for custom decorators (e.g., `@IntegrationDecorator`).
* **Technical Weaknesses**: The API layer is a monolith. Lacks decoupling of write operations (CQRS) and analytical reads. 
* **Enterprise Readiness**: Low. Needs hexagonal domain boundaries to separate the database engine from the business logic.

### 3.3 Authentication, Authorization & Multi-tenancy
* **Current State**: Postiz implements custom session cookies/JWT auth. Multi-tenancy is based on a simple `Organization` model, where users belong to organizations. 
* **Technical Strengths**: Simple and easy to run locally.
* **Technical Weaknesses**: No concept of isolated Workspaces within an Organization. No OAuth security boundaries; tokens are stored in the database.
* **Enterprise Readiness**: Extremely Low. Lacks SCIM, SAML, RBAC/ABAC role mappings, and zero cross-tenant leakage guarantees.

### 3.4 Database & ORM Layer
* **Current State**: Prisma ORM with PostgreSQL.
* **Technical Strengths**: Prisma schema is clean and expressive. Migrations are well-managed.
* **Technical Weaknesses**: Prisma's client-side query generation makes global Row-Level Security (RLS) enforcement difficult without wrapping every query. High connection pooling overhead when scaling serverless.
* **Enterprise Readiness**: Medium. PostgreSQL is suitable for metadata, but ClickHouse is required for analytics.

### 3.5 Queueing, Scheduling & Workers
* **Current State**: BullMQ (Redis-backed) manages cron jobs and scheduling triggers.
* **Technical Strengths**: Easy to deploy.
* **Technical Weaknesses**: Lacks durable execution guarantees. If Redis runs out of memory, jobs can be lost. Retries are custom-coded, creating high risk for complex scheduling dependencies.
* **Enterprise Readiness**: Low. Does not support visual workflow tracing or distributed sagas.

### 3.6 Social Integrations
* **Current State**: A comprehensive collection of social providers, inheriting the `SocialAbstract` class.
* **Technical Strengths**: Robust implementations of Meta Graph, X API, LinkedIn API, TikTok, Pinterest, etc. Handles image/video uploading to social endpoints.
* **Technical Weaknesses**: Highly volatile error mapping. Rate limits are handled naively.
* **Enterprise Readiness**: High. This is the single most valuable component of Postiz, representing hundreds of saved engineering hours.

---

## 4. Capability Gap Analysis

### 4.1 System Coverage Mapping

```mermaid
radar
    title Postiz vs Fluxora Target Capabilities
    "Multi-Tenant Isolation": 3
    "Social Integrations": 9
    "Scheduling & Workflows": 4
    "Secure Credentials": 2
    "Analytics & Telemetry": 3
    "Agency Approvals": 1
    "AI Content Ops": 2
```

### 4.2 Gap Severity & Action Plan

| Core Capability | Postiz Coverage | Gap Severity | Justification for Action | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace Partitioning** | 30% | Critical | Postiz lacks client isolation layers necessary for digital marketing agency compliance. | **Refactor**: Modify Prisma schema, partition schemas, and inject workspace IDs via JWT validation. |
| **Durable Execution** | 40% | High | Cron sprawl in BullMQ causes scheduling drift and lacks transaction integrity. | **Replace**: Implement Temporal scheduler workflows with atomic states. |
| **Secrets Vaulting** | 10% | Critical | Storing access tokens in plain/simply encrypted PostgreSQL database columns is a vector for credential leakage. | **Replace**: HashiCorp Vault integration (Transit Secrets Engine). |
| **ClickHouse Ingestion** | 20% | High | High-throughput events query latency in PostgreSQL scales poorly. | **Replace**: Set up Kafka event stream piping directly into ClickHouse database. |
| **Client Portal** | 0% | Critical | Needed to fulfill the primary agency beachhead value proposition. | **Build New**: Clean white-labeled Next.js workspace client approval gate. |
| **OpenTelemetry** | 10% | Medium | Lacks monitoring infrastructure for SLA guarantees. | **Adopt**: OTel middleware for NestJS API. |

---

## 5. Reuse vs Refactor Matrix

The following matrix categorizes all major Postiz modules and defines their target execution paths.

```
Postiz Codebase
  ├── Keep/Reuse As-Is:   Social Adapters (Libraries)
  ├── Refactor/Extend:    Next.js UI Frontend, Prisma Schema
  ├── Replace/Deprecate:  BullMQ Queue, Session Auth, OAuth DB Table
  └── Build New:          Temporal Workflows, Kafka Telemetry Ingest, Client Approval Portal
```

### 5.1 Module Recommendations

| Module / File Location | Purpose | Reusability | Refactor Requirements | Est. Effort (Person-Days) | Dependencies | Risks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `libraries/nestjs-libraries/src/integrations/social` | Social channel API interactions | High (85%) | Wrap inside Temporal workflows; remove direct database imports, fetch tokens from Vault proxy instead. | 15 | HashiCorp Vault client, Temporal SDK | Third-party API changes breaking the provider signatures. |
| `apps/frontend` | Next.js layout, scheduling UI | Medium (50%) | Refactor to Next.js 15, adapt design system tokens (shadcn/ui), integrate Keycloak authentication. | 25 | Keycloak JS client, Zustand state | Styling conflicts, React 19 compatibility. |
| `libraries/nestjs-libraries/src/database/prisma` | Database schema & Prisma client | Low (20%) | Add `tenant_id` and `workspace_id` to all tables; establish RLS; remove raw OAuth columns. | 12 | PostgreSQL schemas | Migration downtime, data drift. |
| `apps/orchestrator` | Queue workers (BullMQ) | Low (10%) | Remove BullMQ consumer logic; replace with Temporal worker nodes executing activities. | 18 | Temporal cluster | Workflow versioning and schema drift. |
| `libraries/nestjs-libraries/src/user` | Auth & User details | Low (15%) | Deprecate local password hashing; replace with Keycloak user sync webhooks. | 8 | Keycloak admin SDK | Token sync latency. |
| `libraries/nestjs-libraries/src/upload` | Media upload helper | Medium (60%) | Route media streams through Sharp / FFmpeg worker queues before writing to MinIO. | 7 | MinIO / Sharp, FFmpeg | Out-of-memory errors on large video files. |

---

## 6. Target Fluxora Architecture

Fluxora's target architecture is built around hexagonal domain boundaries, event-driven state propagation, and secure credentials management.

```
                                  ┌───────────────────────────┐
                                  │      Kong API Gateway     │
                                  └─────────────┬─────────────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          ▼                     ▼                     ▼
                 ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
                 │ Identity Service│   │ Content Service │   │ Asset Service   │
                 │   (Keycloak)    │   │    (NestJS)     │   │ (MinIO / Sharp) │
                 └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
                          │                     │                     │
                          ▼                     ▼                     ▼
                  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
                  │Keycloak OAuth│      │ PostgreSQL 16│      │ HashiCorp    │
                  │  (User/RBAC) │      │ (Transactional)│    │ Vault Tokens │
                  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
                           │                        │                        │
                           └────────────────────────┼────────────────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────────┐
                                       │  Kafka / Temporal Bus    │
                                       └────────────┬─────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────────┐
                                       │   ClickHouse Analytics   │
                                       └──────────────────────────┘
```

### 6.1 Frontend System Strategy
* **Next.js 15 Core**: The application acts as a React 19 Next.js dashboard. Layout is divided into Multi-Workspace boards, with routing rules governed by the subfolder path (`/w/[workspace_id]/calendar`).
* **Design System**: Strict adherence to shadcn/ui. Styling tokens are defined in `index.css` using custom Tailwind hsl variables to allow white-labeled CSS variables to compile at runtime based on the workspace metadata.
* **State Management**: **Zustand** manages client-side caching of workspace settings and previews.

### 6.2 Backend Hexagonal Architecture
* **NestJS Microservices**: Split into isolated services communicating via Apache Kafka.
* **Domain-Driven Boundaries**:
  * **Identity Domain**: User sync, RBAC mappings (Keycloak-facing).
  * **Tenant Domain**: Workspace and billing configuration.
  * **Content Domain**: Posts metadata, platform overrides.
  * **Asset Domain**: MinIO storage paths and Sharp/FFmpeg worker queues.
  * **Publishing Domain**: Temporal workers running the social adapters.
* **API Ingress Gateway**: **Kong Gateway** intercepting requests. It parses the caller's JWT, validates access permissions against Keycloak, and injects `X-Tenant-ID` and `X-Workspace-ID` headers into downstream service payloads.

### 6.3 Data Isolation & Ingestion Strategy
* **SaaS Ingestion Database**: PostgreSQL 16 acts as the transactional system. Each table utilizes row-level security (RLS) policies scoped by `tenant_id` and `workspace_id`.
* **Telemetry Event Stream**: All post events (e.g. `post.dispatched`, user clicks, impressions) publish to Kafka topic `fluxora.telemetry.events`. 
* **Analytics Engine**: Vectorized ClickHouse engines consume from Kafka directly using the ClickHouse Kafka Engine table, aggregating timeseries metrics with sub-second performance.

### 6.4 Security Architecture
* **OAuth token storage**: Handled using HashiCorp Vault via the Key-Value (KV) secrets engine. The NestJS backend requests tokens dynamically via a secure role token.
* **Audit Trails**: Every API write operation executes the Transactional Outbox pattern. Events are logged to Kafka topic `fluxora.audit.log` and stored in a read-only PostgreSQL table partition.

---

## 7. Detailed Refactoring Blueprint

### 7.1 Harvesting Social Providers from Postiz
To harvest the social providers from Postiz and run them cleanly in Fluxora's NestJS backend, follow this sequence:

```
Step 1: Extract Social Providers
[Postiz Codebase] ──> Extract libraries/nestjs-libraries/src/integrations ──> Decouple Prisma direct imports

Step 2: Inject Secrets Proxy
Replace Prisma database reads ──> Fetch OAuth tokens from HashiCorp Vault Proxy

Step 3: Encapsulate as NestJS Library
Import into Fluxora @fluxora/publishing-adapters ──> Wrap in Temporal Activity layer
```

#### Refactoring the `SocialAbstract` and OAuth Fetch Code:
In Postiz, providers fetch tokens directly using database services. We refactor this interface to leverage a Vault Provider instead:

```typescript
// Proposed Refactoring for social.abstract.ts
import { Injectable } from '@nestjs/common';
import { VaultService } from '@fluxora/vault';

@Injectable()
export abstract class SocialAbstract {
  constructor(protected vaultService: VaultService) {}

  // Instead of querying PostgreSQL organization/account tables, providers fetch tokens from Vault
  async getCredentials(accountId: string): Promise<Record<string, any>> {
    const vaultPath = `secret/data/workspaces/accounts/${accountId}`;
    const secrets = await this.vaultService.get(vaultPath);
    return secrets.data;
  }
}
```

### 7.2 Decoupling Prisma client
Postiz has standard schemas. We copy the models from `schema.prisma` but alter them to enforce tenant relationships:

```prisma
// Modified schema.prisma snippet for Fluxora Tenant & Workspace isolation
model Tenant {
  id          String      @id @default(uuid())
  name        String
  workspaces  Workspace[]
  createdAt   DateTime    @default(now())
}

model Workspace {
  id          String             @id @default(uuid())
  tenantId    String
  tenant      Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  accounts    ConnectedAccount[]
  posts       Post[]
  assets      Asset[]
  createdAt   DateTime           @default(now())
}

model ConnectedAccount {
  id            String    @id @default(uuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  provider      String
  name          String
  avatarUrl     String?
  vaultSecretId String    // Reference ID in HashiCorp Vault instead of cleartext token columns
  status        String    @default("ACTIVE")
  createdAt     DateTime  @default(now())
}
```

---

## 8. Engineering Roadmap

We split the transition roadmap into six waves. 

```
Wave 0: Foundation ─────> Wave 1: MVP Core ─────> Wave 2: Agency Features
Keycloak, Vault,         Social Adapters,        Approvals, White-labels,
Temporal, PG             Next.js Dashboard       Custom Domains

Wave 3: Enterprise ────> Wave 4: Automation ────> Wave 5: AI Platform
OTel, K8s Scale,         Evergreen Queues,       LangGraph Agents,
ClickHouse               RSS Ingestors           LLM Compliance Router
```

### Wave 0: Infrastructure Foundation & Core Setup (Weeks 1-3)
* **Goals**: Provision Keycloak, HashiCorp Vault, Apache Kafka, PostgreSQL, ClickHouse, and Temporal cluster services in development environments. Scaffold the NestJS monorepo.
* **Deliverables**:
  * Dev-ready `docker-compose.infra.yaml`.
  * Initial Prisma DB migration setting up Tenant, Workspace, and updated Account models.
  * Keycloak config file with default Client, User, and Admin role templates.
* **Dependencies**: None.
* **Engineering Effort**: **35 Person-Days**.
* **Risks**: High network configuration overhead mapping OAuth redirect callbacks between Keycloak and local dev gateway.
* **Acceptance Criteria**: Running `specify check` completes successfully. A tenant and user can be registered via Keycloak, yielding a local PostgreSQL record.
* **Exit Criteria**: Developer environments can retrieve dynamic access tokens from Vault using reference IDs.

### Wave 1: Core Omnichannel Publishing MVP (Weeks 4-6)
* **Goals**: Extract Postiz social integrations and wrap them behind NestJS publishers. Connect Next.js 15 frontend, mapping the Unified Composer layout.
* **Deliverables**:
  * Decoupled `@fluxora/publishing-adapters` package.
  * Temporal Workflows: `PostPublishingWorkflow`, `TokenLifecycleWorkflow`.
  * S3/MinIO media ingestion library.
* **Dependencies**: Wave 0.
* **Engineering Effort**: **45 Person-Days**.
* **Risks**: Social networks token revocation during staging runs.
* **Acceptance Criteria**: A user connects a LinkedIn/Meta account, composes a text-and-image post, and schedules it. The Temporal scheduler workflow fires, and the post goes live.
* **Exit Criteria**: Omnichannel posting rates achieve $\ge 99.9\%$ success in staging.

### Wave 2: Agency Operating System (Weeks 7-9)
* **Goals**: Implement Client Approval gates, email notification webhooks, and white-labeled reverse proxy configurations.
* **Deliverables**:
  * Next.js external client approval page (tokenized secure links).
  * Kong Gateway dynamic domain configuration.
  * Temporal `ApprovalLoopWorkflow`.
* **Dependencies**: Wave 1.
* **Engineering Effort**: **35 Person-Days**.
* **Risks**: Securing external tokenized links from URL hijacking.
* **Acceptance Criteria**: Creators generate review links. Clients click link, view preview, and click "Approve", automatically pushing the post into the Temporal schedule queue.
* **Exit Criteria**: Custom domains map successfully to targeted workspaces.

### Wave 3: Enterprise Observability & Scaling (Weeks 10-11)
* **Goals**: Deploy OpenTelemetry collectors, set up the Kafka telemetry consumer pipe, and provision ClickHouse performance charts.
* **Deliverables**:
  * OTel collector helm charts.
  * ClickHouse Kafka consumer engine SQL migration.
  * Grafana dashboards mapping engagement telemetry.
* **Dependencies**: Wave 2.
* **Engineering Effort**: **24 Person-Days**.
* **Risks**: ClickHouse schema migrations locking production databases.
* **Acceptance Criteria**: Streaming 1,000 telemetry events per second into Kafka outputs to ClickHouse within 1.5 seconds.
* **Exit Criteria**: Engagement dashboards respond in under 500ms.

### Wave 4: Automation Layer (Weeks 12-13)
* **Goals**: Implement RSS feeds parsing pipelines, evergreen recycling schedules, and automated anti-ban stagger optimization.
* **Deliverables**:
  * Temporal `RSSIngestionWorkflow`.
  * Distribution Intelligence staggering optimizer.
* **Dependencies**: Wave 3.
* **Engineering Effort**: **20 Person-Days**.
* **Risks**: Rate limits triggered by RSS feed loops.
* **Acceptance Criteria**: Automated staggers split post schedules by 3-minute offsets automatically across selected channels.
* **Exit Criteria**: Stagger offsets prevent bot detection flags on target sandboxes.

### Wave 5: AI Platform & LangGraph (Weeks 14-15)
* **Goals**: Deploy the custom LLM Router, Brand Compliance checker, and LangGraph workflow orchestration.
* **Deliverables**:
  * `@fluxora/ai-router` package.
  * Compliance check activity integrated into the Temporal composer loop.
* **Dependencies**: Wave 4.
* **Engineering Effort**: **22 Person-Days**.
* **Risks**: LLM hallucination in compliance checker allowing toxic posts.
* **Acceptance Criteria**: Post copy is automatically checked by the LLM against workspace brand rules, highlighting violations in the editor.
* **Exit Criteria**: AI-assistant acceptance rate exceeds 75% in beta cohorts.

---

## 9. Database & Migration Strategy

To transition from the Postiz schema to Fluxora's multi-tenant database:

```
Phase 1: DB Schema Provisioning ──> PostgreSQL schemas & RLS Policies initialized
Phase 2: Data Extraction         ──> Export Postiz accounts/posts to temporary tables
Phase 3: Vault Ingestion         ──> Run migration script to move access tokens to Vault
Phase 4: Workspace Mapping       ──> Map organizations to tenants and initialize workspaces
Phase 5: Schema Cleanup          ──> Drop raw token columns and enable PostgreSQL RLS
```

### 9.1 Data Transformation Migration Script (PostgreSQL to Vault)
This Node.js migration script executes the extraction of tokens from the old Postiz schema, writes them into Vault, and updates the reference column in PostgreSQL.

```typescript
// Migration Script Example: postgres-to-vault-migration.ts
import { Client } from 'pg';
import { VaultClient } from './vault-client';

async function migrateTokens() {
  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  const vault = new VaultClient({ address: process.env.VAULT_ADDR, token: process.env.VAULT_TOKEN });
  
  await pgClient.connect();
  const accounts = await pgClient.query('SELECT id, token, "refreshToken" FROM "ConnectedAccount" WHERE "vaultSecretId" IS NULL');
  
  for (const row of accounts.rows) {
    const secretId = `account-${row.id}`;
    
    // Write sensitive credentials to Vault
    await vault.write(`secret/data/workspaces/accounts/${secretId}`, {
      token: row.token,
      refreshToken: row.refreshToken
    });
    
    // Update reference in PostgreSQL
    await pgClient.query(
      'UPDATE "ConnectedAccount" SET "vaultSecretId" = $1, token = NULL, "refreshToken" = NULL WHERE id = $2',
      [secretId, row.id]
    );
  }
  
  console.log(`Migrated ${accounts.rowCount} credentials successfully.`);
  await pgClient.end();
}
```

### 9.2 Zero-Downtime Rollback Strategy
1. **Parallel Schema Mode**: During migration deployment, PostgreSQL supports both old token columns and the new `vaultSecretId` reference column.
2. **Dual Writes**: The backend code is temporarily deployed to write tokens to both the database (encrypted) and Vault.
3. **Validation Stage**: Staging tests confirm Vault accessibility.
4. **Deprecation**: Once validated, database columns are dropped. If Vault becomes unresponsive, we rollback the API service to the previous Docker image using standard Kubernetes rollout undo.

---

## 10. Security & Compliance Plan

Enterprise digital operations mandate absolute security:

### 10.1 Zero Trust Data Isolation
* **PostgreSQL Row-Level Security (RLS)**:
  ```sql
  -- Example SQL schema partitioning rules for Fluxora
  ALTER TABLE "ConnectedAccount" ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_policy ON "ConnectedAccount"
    USING (workspace_id = current_setting('app.current_workspace_id'));
  ```
* **Keycloak IAM**: Every user login generates an OIDC JWT. The JWT includes a list of authorized workspace IDs in the custom claim fields. When the Kong gateway receives the JWT, it sets `app.current_workspace_id` in the transaction session context of PostgreSQL before forwarding queries.

### 10.2 Secrets Management Lifecycle
* **Vault Key Management**: OAuth client secrets, Resend API keys, and database passwords are encrypted with keys managed by HashiCorp Vault.
* **Secrets Rotation**: Vault rotates database credentials hourly using dynamic database secrets configurations. OAuth tokens are refreshed automatically by the Temporal workflow lifecycle, saving new tokens to Vault upon generation.

---

## 11. Infrastructure & DevOps Plan

### 11.1 Deployment Topology
Fluxora is deployed across isolated Kubernetes (EKS/GKE) namespaces:

```
Internet ──> Traefik API Gateway ──> Kong (JWT Validation) ──> Web Service Pods
                                                                  │
                                   ┌──────────────────────────────┴──────────────┐
                                   ▼                                             ▼
                          PostgreSQL StatefulSet                        Kafka StatefulSet
                                                                                 │
                                                                                 ▼
                                                                        ClickHouse Cluster
```

* **Gateway Routing**: Kong handles API rate limiting and CORS validation. Traefik routes web traffic directly to Next.js UI nodes.
* **Worker Scaling**: FFmpeg workers are deployed as separate Pods managed by K8s HPA (Horizontal Pod Autoscaler) scaling based on BullMQ/Temporal queues telemetry depth.

### 11.2 DevSecOps Tooling & Infrastructure as Code (IaC)
* **Terraform**: Provisions all AWS components (EKS cluster, RDS PostgreSQL, MSK Kafka cluster, ElastiCache Redis, S3).
* **GitOps (ArgoCD)**: Monitors repository branch changes and syncs deployments to Kubernetes.
* **Policy Enforcement**: **OPA (Open Policy Agent)** validates Kubernetes manifests before deployment, preventing privilege escalation.

---

## 12. Risk Register & Mitigation Plan

The following matrix represents the operational risks for the roadmap execution.

| Risk ID | Description | Severity | Probability | Mitigation Strategy | Contingency Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | Social API Changes breaking the adapters. | High | Medium | Decouple provider adapters into an independent semantic NPM module. | Implement mock adapters for emergency automated testing runs. | Tech Lead |
| **R-02** | Vault Connection Latency slows API reads. | Medium | Low | Implement microsecond Memcached/Redis layer for short-lived vaulted structures. | Fallback to secure client-side decrypt in backend application memory. | DevOps |
| **R-03** | Temporal queue drift causing scheduling delay. | High | Medium | Prometheus metrics monitoring Temporal workflow backlog depth. | Failover scheduler runner running on standard cron node. | Tech Lead |
| **R-04** | Cross-tenant token leakage. | Critical | Low | Complete RLS coverage in PostgreSQL and schema tests. | Emergency revoke script executing Vault tokens wipe. | SecOps |

---

## 13. Delivery Timeline

Below is the execution schedule for the 15-week engineering delivery plan.

```
Wave 0: Infra & DB Setup  | ██████ (W1-3)
Wave 1: Omnichannel MVP  |        ████████ (W4-6)
Wave 2: Agency OS (Approvals)     |                ████████ (W7-9)
Wave 3: Observability & Ingest    |                        ████ (W10-11)
Wave 4: Automation Layer          |                             ████ (W12-13)
Wave 5: AI & LangGraph            |                                  ████ (W14-15)
```

### 13.1 Critical Path Analysis
The **Critical Path** runs through **Wave 0 (DB schema / Vault mapping)** to **Wave 1 (Social adapter refactoring)** to **Wave 2 (Client approval portals)**. Because Wave 2 is the core differentiator for our beachhead market (Agencies), any delays in provisioning Vault or Keycloak integrations directly slips the MVP launch schedule. Wave 3, 4, and 5 can execute in parallel once the core publishing pipeline is validated.

---

## 14. Resource Plan

To achieve the 15-week timeline, the following staffing model is allocated:

* **1 Principal Product Architect / Lead PM**: Handles requirements, user story validation, and roadmaps.
* **2 Backend Engineers (NestJS / Node / TS)**: Focused on refactoring the Postiz adapters, Temporal workflows, and database schemas.
* **1 Frontend Engineer (Next.js / Zustand)**: Focused on building the Unified Composer, Calendar view, and Client portal UI.
* **1 DevSecOps / Infrastructure Engineer**: Manages Terraform scripts, Keycloak setup, HashiCorp Vault integrations, and Kafka ClickHouse pipelines.
* **1 QA Automation Engineer**: Focuses on Playwright browser testing and validation scripts.

---

## 15. Cost Model

### 15.1 Development Phase Infrastructure Cost (Monthly)
* **AWS RDS PostgreSQL (db.t4g.medium, Multi-AZ)**: $70
* **AWS ElastiCache Redis (cache.t4g.small)**: $35
* **AWS MSK (Kafka) Dev Instance**: $180
* **Temporal Cloud (Managed Dev Pay-as-you-go)**: $50
* **Compute (EKS Dev Node Group - 3x t3.large)**: $220
* **Total Development Hosting Costs**: **$555/month**

### 15.2 Production Scaling Phase Cost (Monthly - Est. 50 Agencies / 2,000 Brands)
* **AWS Aurora PostgreSQL Serverless v2**: $300
* **ClickHouse Cloud (Managed, Shared Entry Tier)**: $250
* **Temporal Cloud Production Namespace**: $200
* **AWS EKS Production Node Groups (6x m6g.large)**: $720
* **HashiCorp Vault Cloud (HCP Vault Starter)**: $150
* **SaaS API Integrations (Resend, Twilio, OpenAI API)**: $400
* **Total Production Cost**: **$2,020/month**

---

## 16. Critical Recommendations

Whenever implementing new components, the following governance blocks must be used:

### 16.1 Keycloak Authentication Integration
```text
Capability: Identity and Access Management (IAM)
Reason Needed: Enterprise-grade single sign-on (SSO), SCIM provisioning, and multi-tenant user access boundaries.

Existing OSS: Keycloak, Authelia, Ory Kratos
Existing SaaS: Auth0, Clerk

Adopt? Yes (Keycloak)
Extend? Yes (Custom Keycloak SPI for workspace registration sync)
Wrap? No
Fork? No
Build? No

Why: Keycloak is the industry standard for open-source identity, supporting SAML, OIDC, and custom user role mapping with zero licensing costs, de-risking vendor lock-in.

Operational Cost: Medium (Requires maintaining a stateful Keycloak deployment on Kubernetes)
Security Impact: Extremely positive (SOC2-compliant authentication architecture)
Maintenance Burden: Low (Security patches are managed by Red Hat/community)
Vendor Risk: None (Fully open source)
Exit Strategy: Standard OIDC configurations make migration to Auth0 or Clerk a simple configuration change.
```

### 16.2 HashiCorp Vault Secrets Integration
```text
Capability: OAuth Access Token Vaulting
Reason Needed: Safely store sensitive social network API access tokens away from relational metadata databases.

Existing OSS: HashiCorp Vault, Mozilla SOPS, Bitnami Sealed Secrets
Existing SaaS: AWS Secrets Manager, Doppler

Adopt? Yes (HashiCorp Vault)
Extend? No
Wrap? Yes (NestJS Vault Service facade)
Fork? No
Build? No

Why: Storing secrets in transactional relational databases creates massive legal liabilities in multi-tenant SaaS. Vault provides hardware security module (HSM) level isolation and transit encryption.

Operational Cost: Medium (Requires Vault cluster management and secure unsealing procedures)
Security Impact: Critical (Guarantees zero plain-text token leaks from PostgreSQL SQL injections)
Maintenance Burden: Low
Vendor Risk: Low (Mozilla Public License)
Exit Strategy: Can migrate to AWS Secrets Manager using standard Vault-to-AWS synchronizer templates.
```

---

## 17. Final Go/No-Go Assessment

### Assessment: **GO**

#### Justification:
The due-diligence analysis confirms that utilizing **Postiz as an accelerator** yields a development timeline reduction of approximately **55%** compared to a greenfield rewrite. Postiz provides mature social network providers that require minimal adjustment to execute. By systematically refactoring the database model to enforce tenant/workspace RLS, migrating credential storage to HashiCorp Vault, and adopting Temporal workflows for core scheduling, Fluxora achieves enterprise-grade security and reliability with minimal risk. 

The architecture is clean, the roadmap is highly structured, and the team composition is lean. We recommend immediate commencement of **Wave 0**.
