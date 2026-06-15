<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Bump Rationale: Material expansion of governance principles, domains, differentiators, and review requirements as mandated by the Chief Technology Officer.
- Modified Principles:
  - Principle I (Adopt → Extend → Wrap → Fork → Build): Clarified order of priority.
  - Principle II (Build Domains, Not Features): Expanded from 10 to 13 mandatory domains.
- Added Sections:
  - Required OSS Discovery Process (Step 1-4)
  - Security Review Requirements
  - Licensing Review Requirements
  - TCO Review Requirements
  - AI Platform Requirements
  - Observability & Telemetry Specifications
- Templates/Docs updated:
  - c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast\.specify\memory\constitution.md (✅ updated)
  - c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast\docs\architecture_guidelines.md (✅ updated)
- Follow-up TODOs: None
-->

# Fluxora Platform Constitution

This document defines the architectural guidelines, core governance principles, and technical stacks for the Fluxora Platform. All developers and AI agents working on this project must adhere strictly to these principles.

---

## Core Principles

### I. Adopt → Extend → Wrap → Fork → Build
Before suggesting, proposing, or writing any code or capability, search for:
1. Existing OSS ecosystems (e.g., Postiz, n8n, CNCF projects, Kong plugins, Keycloak extensions).
2. SaaS APIs (e.g., Stripe, Resend, Twilio, Firebase).
3. SDKs, templates, Helm charts, Terraform modules, and existing adapters.

**ONLY build functionality that creates strategic differentiation.** Never reverse this order.

### II. Build Domains, Not Features
Organize the codebase and services strictly around business domains, never around UI pages. The 13 mandatory domains are:
- **Identity Domain**: User accounts, credentials, RBAC/ABAC mappings, SSO.
- **Tenant Domain**: Tenancy configuration, billing boundaries, workspace assignments.
- **Content Domain**: Social posts metadata, channel variants, drafts, presets.
- **Asset Domain**: Media files, metadata, tagging, search indexes.
- **Publishing Domain**: Execution logic for social platforms, channel APIs.
- **Distribution Domain**: Proxy layers, rate-limit state, staggering engine.
- **Workflow Domain**: Stateful approvals, scheduling queues, orchestration state.
- **Analytics Domain**: Engagement tracking, time-series telemetry metrics.
- **AI Domain**: LLM routing, copy refinement, campaign intelligence, brand memory.
- **Billing Domain**: Subscriptions, entitlements, invoices, metering.
- **Agency Domain**: White-label custom domains, client approval portals.
- **Governance Domain**: Policy enforcement, compliance rules, audit logging.
- **Observability Domain**: Log collectors, metrics aggregators, distributed traces.

### III. Workflow First
Every long-running or stateful process MUST be a workflow.
- **Adopt:** Temporal (Responsibilities: Scheduling, Publishing, Approvals, Asset processing, AI workflows, Token refresh, Campaign execution, Analytics processing, Retry orchestration)
- **Avoid:** Cron Sprawl, Ad Hoc Queues, Custom Workflow/Job Engines

### IV. Event-Driven Everything
All significant state changes MUST emit events.
- **Transport:** Apache Kafka (Responsibilities: Telemetry, Audit, Analytics, AI events, Domain events)
- **Mandatory Events:** `tenant.created`, `workspace.created`, `asset.uploaded`, `asset.processed`, `post.created`, `post.scheduled`, `post.dispatched`, `approval.requested`, `approval.granted`, `token.refreshed`, `campaign.completed`.
- **Constraint:** Never allow service-to-service spaghetti; rely on event mesh orchestration.

### V. Sacred Tenant Isolation
Every database entity, message payload, and request context MUST contain and enforce:
- `tenant_id`
- `workspace_id`
- `created_by`

*No exceptions are permitted. Isolation applies to APIs, Databases, Queues, Storage, Analytics, and AI. Cross-tenant access is strictly forbidden.*

---

## Technical Stack & Approved Adoptions

To minimize development velocity friction and avoid redundant infrastructure building, the following components are pre-approved and adopted:

- **Identity & Auth**: Keycloak (OAuth2, OIDC, SAML, MFA, SCIM, Federation)
- **API Gateway**: Kong Gateway (JWT validation, Rate limiting, Tenant enforcement, API versioning)
- **Secrets Management**: HashiCorp Vault (OAuth tokens, API keys, Certificates, Encryption keys)
- **Workflow Orchestration**: Temporal (Scheduling, Publishing, Approvals, AI workflows, Retry orchestration)
- **Queue Layer**: Redis & BullMQ (only behind abstraction; platform workflows use Temporal)
- **Event Mesh**: Apache Kafka (Telemetry, Audit, Analytics, AI events, Domain events)
- **Transactional Data Layer**: PostgreSQL (Stores: Tenants, Users, Workspaces, Posts, Campaigns, Schedules)
- **Analytics Layer**: ClickHouse (Stores: Telemetry, Engagement, Performance, Aggregations)
- **Search Engine**: OpenSearch (Stores: Assets, Campaigns, Content, Audit trails)
- **Asset Processing**: MinIO & AWS S3 (Storage), Sharp (Images), FFmpeg (Video), CloudFront (CDN)
- **Observability**: OpenTelemetry, Prometheus, Grafana, Loki, Tempo (Metrics, logs, traces, events mandatory for every service)
- **Feature Flagging**: Unleash (AI rollout, Customer segmentation, Beta features)
- **Billing & Subscriptions**: Stripe (Metering, Billing, Subscriptions; entitlement engine is custom-built)
- **Notifications**: Resend (Email), Twilio (SMS), Firebase (Push Notifications)
- **AI Orchestration**: LangGraph & Temporal orchestrating OpenAI, Anthropic, and Gemini (Never build foundation models; store memory in Qdrant)
- **Vector Search**: Qdrant (Brand, content, and agent memory)
- **Frontend Stack**: Next.js (version 15), React (version 19), Tailwind CSS, shadcn/ui (Avoid custom component libraries)
- **Backend Stack**: NestJS (CQRS, Hexagonal/DDD, Repository, Outbox, Saga patterns)
- **DevSecOps**: GitHub Actions, Terraform, Docker, Kubernetes, ArgoCD, OPA, Kyverno

---

## Proprietary Fluxora Differentiators

Proprietary engineering effort MUST be strictly focused on the following differentiators. Any proposal outside these domains must be heavily justified using the component proposal template.

1. **Distribution Intelligence Engine**: Anti-ban staggering, dispatch optimization, retry intelligence, rate-limit intelligence.
2. **Agency Operating System**: Workspace isolation, white-labeling, client portals, client approvals, agency workflows.
3. **Content Adaptation Engine**: Channel transformations, asset variants, format adaptation, media optimization.
4. **AI Operations Layer**: Brand memory, compliance verification, copy generation, campaign orchestration, content intelligence.
5. **Analytics Intelligence Layer**: Attribution, ROI, operational velocity, distribution effectiveness.
6. **Multi-Tenant Governance Engine**: Workspace isolation, tenant enforcement, policy controls, compliance boundaries.

---

## Required OSS Discovery Process

Before implementing any capability, the team MUST execute the following process:

1. **Capability Decomposition**: Identify Business Capability, Technical Capability, Operational Capability, Compliance Capability.
2. **OSS Discovery**: Search for OSS, SDK, API, Framework, Reference Architecture, Terraform Module, Helm Chart, Operator.
3. **Qualification**: Evaluate Architecture Fit, Security, Freshness, Governance, Community, Licensing, Integration Cost, Operational Cost.
4. **Recommendation**: Classify as Adopt, Extend, Wrap, Fork, or Build.

---

## Security, Licensing & TCO Review Requirements

Every architectural decision and component recommendation MUST produce:

### 1. Security Review
- **Evaluation criteria:** CVEs, Advisories, Dependency Health, SBOM, Release Signing, Bus Factor, Maintainer Risk, Supply Chain Risk.
- **Deliverables:** Document Risk, Likelihood, Impact, Mitigation, Residual Risk.

### 2. Licensing Review
- **Evaluation criteria:** MIT, Apache 2, BSD, LGPL, GPL, AGPL, Commercial, Dual License.
- **Deliverables:** Document Commercial Risk, Copyleft Risk, Distribution Risk, SaaS Risk.

### 3. TCO Review
- **Evaluation criteria:** Hosting Complexity, Scaling Complexity, Operational Complexity, Maintenance Burden, Upgrade Burden, Supportability, Migration Complexity.
- **Deliverables:** Rate operational burden as Low, Medium, or High.

---

## AI Platform Requirements

- **Foundation Models**: Never build or fine-tune foundation models. Adopt OpenAI, Anthropic, and Gemini.
- **Orchestration**: Use LangGraph and Temporal.
- **Vector Memory**: Store all memory structures in Qdrant.
- **Proprietary AI Components (Build Only these):**
  - **Fluxora AI Orchestrator**: Manages multi-agent LangGraph execution loops.
  - **Fluxora Brand Memory**: Manages semantic brand guidelines and tone presets in Qdrant.
  - **Fluxora Campaign Intelligence**: Analyzes engagement context and automates campaign generation.

---

## Component Proposal Governance

Whenever proposing a new component, you MUST produce the following evaluation block:

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

---

## Development Workflow & Spec-Driven Development

1. **Constitution First**: The constitution (this document) governs all plans, tasks, and implementations.
2. **Spec-Driven Development (SDD)**: Development must flow sequentially through Spec -> Plan -> Tasks -> Implement.
3. **Execution Commands**:
   - `specify check`: Verify CLI requirements and configurations.
   - `/speckit-constitution`: Check/update project rules.
   - `/speckit-specify`: Create baseline feature specs.
   - `/speckit-plan`: Create technical implementation plans.
   - `/speckit-tasks`: Generate actionable checklists.
   - `/speckit-implement`: Run code implementation.

**Version**: 1.1.0 | **Ratified**: 2026-06-15 | **Last Amended**: 2026-06-15
