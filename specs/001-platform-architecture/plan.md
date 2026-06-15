# Implementation Plan: Fluxora Platform Architecture

**Branch**: `001-platform-architecture` | **Date**: 2026-06-15 | **Spec**: [specs/001-platform-architecture/spec.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/specs/001-platform-architecture/spec.md)

**Input**: Feature specification from `/specs/001-platform-architecture/spec.md`

## Summary
The goal of the platform architecture feature is to establish the infrastructure scaffolding, secure identity flows, credential vaulting, event streaming, analytics pipelines, and durable execution state machines for Fluxora. We decouple social channel providers from the Postiz monorepo, wrapping them in NestJS facades inside a microservices monorepo. Transactional data is managed in PostgreSQL 16 using Row-Level Security (RLS) scoping, credentials are vaulted in HashiCorp Vault, events route through Kafka to ClickHouse for analytics, and workflows are run using Temporal workers.

## Technical Context

**Language/Version**: Node.js v20+, TypeScript v5.2, React v19, Next.js v15.

**Primary Dependencies**: NestJS Core, Prisma ORM, Keycloak Connect SDK, Node-Vault SDK, Temporal SDK, KafkaJS, Sharp, FFmpeg.

**Storage**: PostgreSQL 16 (metadata, tenants, configurations), ClickHouse (telemetry, aggregations), MinIO (local S3 asset storage).

**Testing**: Vitest for unit/integration, Playwright for E2E browser automation.

**Target Platform**: Kubernetes (AWS EKS), Traefik ingress, Kong API Gateway.

**Project Type**: Monorepo with NestJS backend microservices and Next.js frontend dashboard.

**Performance Goals**: API ingestion-to-queue speed $\le 2.0$s, analytics dashboard load time $\le 500$ms, telemetry ingestion latency $\le 1,500$ms.

**Constraints**: Row-level tenant partitioning, HashiCorp Vault token access limits, zero cross-tenant database leaks.

**Scale/Scope**: Support 50+ marketing agencies managing 2,000+ brands and 1,000+ posts/day.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Governance Gate | Status | Justification / Implementation Pattern |
|:---|:---|:---|
| **Adopt → Extend → Wrap → Fork → Build** | PASS | Reusing Postiz social integrations directly, wrapping them in NestJS/Temporal. Adopting Keycloak, Vault, Temporal, Kafka, and ClickHouse. |
| **Build Domains, Not Features** | PASS | Scaffolding the repository around core domains (Identity, Tenant, Publishing, Asset, Workflows, Analytics). |
| **Workflow First (Temporal)** | PASS | All scheduling, publishing attempts, and token refreshes are modeled as durable Temporal workflows. |
| **Event-Driven (Kafka)** | PASS | Every post lifecycle transition publishes to a Kafka topic for observability and ClickHouse consumption. |
| **Sacred Tenant Isolation** | PASS | All database tables and event schemas explicitly contain and partition on `tenant_id` and `workspace_id`. |

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-architecture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (generated tasks list)
```

### Source Code (repository root)

```text
apps/
├── backend/             # NestJS Microservices
│   ├── src/
│   │   ├── identity/    # Identity Domain
│   │   ├── tenant/      # Tenant Domain
│   │   ├── content/     # Content Domain
│   │   ├── publishing/  # Publishing (Temporal Workers & social adapters)
│   │   ├── asset/       # Asset library & transcoding
│   │   └── main.ts
│   └── prisma/
│       └── schema.prisma
│
└── frontend/            # Next.js 15 App
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── package.json
```

**Structure Decision**: Option 2: Web application (frontend Next.js + backend NestJS microservices), with shared library packages for database models and shared utility code.

## Complexity Tracking

*No constitution violations are present; all architectural choices strictly conform to the approved technical adoptions.*
