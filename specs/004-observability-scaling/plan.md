# Implementation Plan: Enterprise Observability & Scaling

**Branch**: `004-observability-scaling` | **Date**: 2026-06-15 | **Spec**: [specs/004-observability-scaling/spec.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/specs/004-observability-scaling/spec.md)

**Input**: Feature specification from `/specs/004-observability-scaling/spec.md`

## Summary

Decouple telemetry ingestion and query processing from PostgreSQL by streaming events through Apache Kafka and persisting them in ClickHouse. We will configure a background consumer to buffer events and perform batch inserts, and update the Analytics API to run aggregations against ClickHouse. If Kafka or ClickHouse services are unreachable, the system will fall back to a local filesystem JSON database sandbox to support offline testing and development.

## Technical Context

**Language/Version**: Node.js v20+, TypeScript v5.7, Next.js v15.

**Primary Dependencies**: `kafkajs` (Apache Kafka client), NestJS packages.

**Storage**: ClickHouse 24+ (telemetry and analytics aggregations), PostgreSQL 16 (transactional data).

**Testing**: Jest for backend tests, Playwright for frontend integration.

**Target Platform**: Docker Compose / Kubernetes.

**Performance Goals**: Telemetry ingestion latency $\le 1,500$ms, dashboard aggregation latency $\le 500$ms.

**Constraints**: Strict workspace isolation filtering by `workspaceId` in ClickHouse. Offline-capable execution using a local file sandbox fallback.

**Scale/Scope**: Supports 1,000+ posts/day and high-volume post-engagement event telemetry.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Governance Gate | Status | Justification / Implementation Pattern |
|:---|:---|:---|
| **Adopt → Extend → Wrap → Fork → Build** | PASS | Adopting standard Kafka via KafkaJS, ClickHouse HTTP REST API via fetch, avoiding custom drivers. |
| **Build Domains, Not Features** | PASS | Implementation focused strictly within the Analytics and Observability domains. |
| **Workflow First** | PASS | Post transitions trigger telemetry events within the stateful publishing pipeline. |
| **Event-Driven** | PASS | Emitting telemetry state updates via Kafka event streams. |
| **Sacred Tenant Isolation** | PASS | ClickHouse schema and all queries explicitly partition and filter on `workspaceId`. |

## Project Structure

### Documentation (this feature)

```text
specs/004-observability-scaling/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # API contracts
│   └── analytics-api.md
└── checklists/          # Checklists
    └── requirements.md
```

### Source Code

```text
apps/
├── backend/
│   └── src/
│       ├── analytics/
│       │   ├── analytics.controller.ts     # GET /performance, POST /simulate
│       │   ├── analytics.module.ts
│       │   ├── clickhouse.service.ts       # ClickHouse REST client & sandbox
│       │   └── telemetry.consumer.ts       # Kafka telemetry consumer & batch writer
│       ├── observability/
│       │   └── kafka.service.ts            # Kafka producer service & sandbox fallback
│       └── publishing/
│           └── publish.activities.ts       # Emits event to Kafka instead of DB
└── frontend/
    └── src/
        ├── app/
        │   └── page.tsx                    # Landing page with simulator triggers
        └── components/
            └── AnalyticsDashboard.tsx      # Real-time analytics view with simulator
```

**Structure Decision**: Option 2: Web application (NestJS backend, Next.js frontend).

## Complexity Tracking

*No constitution violations present; all choices strictly conform to the approved technical adoptions.*
