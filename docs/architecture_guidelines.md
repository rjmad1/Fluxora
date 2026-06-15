# Fluxora Platform Acceleration Instruction Set

This document defines the architectural guidelines and governance model for the Fluxora Platform. All developers and AI agents (Cursor, Claude Code, Windsurf, RooCode, OpenHands, Devin, etc.) working on this project must adhere strictly to these principles.

---

## Core Directive

Before implementing any capability:
1. Search for an existing OSS ecosystem.
2. Search for SaaS APIs.
3. Search for SDKs.
4. Search for reference architectures.
5. Search for templates.
6. Search for Terraform modules.
7. Search for Helm charts.
8. Search for operator patterns.
9. Search for proven workflow engines.
10. Search for existing adapters.

Only build functionality that creates strategic differentiation.

### Governance Model: Adopt → Extend → Wrap → Fork → Build
Always prioritize adopting existing solutions over custom building. Never reverse this order.

---

## Architecture Principles

### Principle 1: Build Domains, Not Features
Organize the codebase and services around business domains:
- **Identity**
- **Tenant**
- **Content**
- **Assets**
- **Publishing**
- **Distribution**
- **Analytics**
- **AI**
- **Billing**
- **Governance**

*Never organize around UI pages.*

### Principle 2: Workflow First
Every long-running process must be a workflow.
- **Adopt:** Temporal
- **Avoid:** Cron Sprawl, Custom State Machines, Distributed Job Logic

### Principle 3: Event Driven Everything
All significant state changes emit events.
- **Transport:** Apache Kafka
- **Examples:**
  - `post.created`
  - `post.validated`
  - `post.scheduled`
  - `post.dispatched`
  - `asset.uploaded`
  - `asset.transcoded`
  - `token.refreshed`
  - `tenant.created`
  - `approval.granted`
  - `campaign.completed`

### Principle 4: Tenant Isolation Is Sacred
Every database entity and message payload MUST contain:
- `tenant_id`
- `workspace_id`
- `created_by`

*No exceptions.*

---

## Capability Stack & Adoptions

### Identity Stack (Do NOT build)
- **Adopt:** Keycloak
- **Capabilities:** OIDC, OAuth2, SAML, MFA, RBAC, Federation, SCIM
- **SDKs:** `keycloak-js`, NestJS OIDC adapters

### API Gateway
- **Adopt:** Kong Gateway or Traefik
- **Capabilities:** JWT validation, Rate limiting, API versioning, Tenant enforcement

### Secrets (Never build)
- **Adopt:** HashiCorp Vault
- **Store:** OAuth tokens, API keys, Signing certificates, Encryption keys

### Workflow Engine (Never build)
- **Adopt:** Temporal
- **Use for:** Publishing, Scheduling, Approvals, Asset processing, Token refresh, AI workflows

### Queue Layer
- **Adopt:** Redis / BullMQ (Only behind abstraction to avoid BullMQ becoming core architecture; platform workflows must use Temporal)

### Event Mesh
- **Adopt:** Apache Kafka
- **Capabilities:** Telemetry, Audit trails, Analytics, AI pipelines, Workflow triggers
- *Never allow service-to-service spaghetti.*

### Analytics Stack
- **Transactional:** PostgreSQL
- **Analytics:** ClickHouse
- **Telemetry:** Kafka
- **Visualization:** Grafana

### Search (Do not build)
- **Adopt:** OpenSearch
- **Use for:** Assets, Content, Campaigns, Audit logs

### Asset Management (Build orchestration, NOT infrastructure)
- **Storage:** MinIO
- **Image Processing:** Sharp
- **Video Processing:** FFmpeg
- **CDN:** CloudFront

### Observability (Mandatory)
- **Adopt:** OpenTelemetry, Prometheus, Grafana, Loki, Tempo
- **Telemetry requirement:** Every service must emit logs, metrics, traces, and events.

### Feature Flags (Do not build)
- **Adopt:** Unleash
- **Use for:** AI rollout, Customer segmentation, Beta programs

### Billing (Do not build)
- **Adopt:** Stripe (Billing, Metering, Subscriptions, Invoices)
- **Build only:** Fluxora-specific entitlement engine

### Notifications
- **Email:** Resend
- **SMS:** Twilio
- **Push Notifications:** Firebase

### AI Platform (Do NOT build model infrastructure)
- **Models:** OpenAI, Anthropic, Gemini
- **Framework / Orchestration:** LangGraph, Temporal
- **Build only:** `Fluxora LLM Router`

### Vector Layer
- **Adopt:** Qdrant
- **Use for:** Brand memory, Content memory, Agent memory

### Frontend
- **Adopt:** Next.js, React, Tailwind, shadcn/ui
- *Avoid custom component libraries.*

### Backend
- **Adopt:** NestJS
- **Patterns:** CQRS, Event Sourcing (Selective), Hexagonal Architecture, Domain Driven Design, Repository Pattern, Outbox Pattern, Saga Pattern

### Security Requirements (Mandatory)
Zero Trust, RBAC, ABAC, Audit Logs, MFA, Secrets Rotation, Encryption at Rest, Encryption in Transit, Least Privilege, Tenant Isolation.

### DevSecOps
- **CI/CD:** GitHub Actions
- **IaC:** Terraform
- **Containers:** Docker
- **Orchestration:** Kubernetes
- **GitOps:** ArgoCD
- **Policy:** OPA, Kyverno

---

## Required Reusable Sources

Before coding any capability, search:
1. **Postiz**
2. **n8n**
3. **Temporal Samples**
4. **LangGraph Examples**
5. **OpenTelemetry Reference Architectures**
6. **Keycloak Extensions**
7. **Kong Plugins**
8. **Stripe Samples**
9. **ClickHouse Schemas**
10. **CNCF Landscape**

---

## Proprietary Fluxora Differentiators (Build Only These)

Engineering effort should be strictly focused on:

### 1. Distribution Intelligence Engine
- Anti-ban staggering
- Dispatch optimization
- Retry intelligence

### 2. Agency Operating System
- Workspace isolation
- White-labeling
- Client approvals

### 3. Content Adaptation Engine
- Platform-aware transformations
- Asset variants
- Auto-formatting

### 4. AI Content Operations
- Brand-aware generation
- Compliance validation
- Campaign automation

### 5. Analytics Intelligence Layer
- ROI attribution
- Operational velocity metrics
- Campaign effectiveness scoring

### 6. Multi-Tenant Governance Engine
- Isolation guarantees
- Policy enforcement
- Enterprise controls

---

## Final Rule: Component Proposal Template

Whenever proposing a new component, you must produce:

```text
Capability:
Reason Needed:

Existing OSS:
Existing SaaS:

Adopt?
Extend?
Wrap?
Fork?
Build?

Why?

Operational Cost:
Security Impact:
Maintenance Burden:
Vendor Risk:
Exit Strategy:
```
