# Tasks: Enterprise Observability & Scaling

**Input**: Design documents from `/specs/004-observability-scaling/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install `kafkajs` package in `apps/backend/package.json` and install dependencies.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create local sandbox directories at `apps/backend/logs/clickhouse-sandbox/` and ensure directory initialization.
- [x] T003 Implement `KafkaService` in `apps/backend/src/observability/kafka.service.ts` supporting connection logic and log/file fallback.
- [x] T004 Implement `ClickHouseService` in `apps/backend/src/analytics/clickhouse.service.ts` supporting REST querying and local JSON file database fallback.
- [x] T005 Update `apps/backend/src/analytics/analytics.module.ts` to register `ClickHouseService` and provide it.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Telemetry Event Stream Auditing (Priority: P1)

**Goal**: Publish status transitions as telemetry events to Kafka with graceful fallback.

**Independent Test**: Verify that transitioning posts publishes events to Kafka/log fallback.

### Implementation for User Story 1

- [x] T006 Create test suite in `apps/backend/src/observability/observability.spec.ts` validating Kafka telemetry event emission.
- [x] T007 [US1] Refactor `apps/backend/src/publishing/publish.activities.ts` to emit events via `KafkaService` instead of PostgreSQL Prisma creation.

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - High-Throughput Analytics Ingestion (Priority: P1)

**Goal**: Consume events from Kafka, batch them, and insert them into ClickHouse.

**Independent Test**: Verify Kafka event stream is consumed and batched into ClickHouse/sandbox.

### Implementation for User Story 2

- [x] T008 [US2] Implement `TelemetryConsumer` background worker in `apps/backend/src/analytics/telemetry.consumer.ts` with batching and buffering.
- [x] T009 [US2] Register `TelemetryConsumer` in `apps/backend/src/analytics/analytics.module.ts` and initialize it.

**Checkpoint**: User Stories 1 and 2 work together, piping events to ClickHouse.

---

## Phase 5: User Story 3 - High-Speed Performance Analytics Dashboard (Priority: P2)

**Goal**: Dashboard aggregations query ClickHouse instead of PostgreSQL.

**Independent Test**: GET `/api/v1/analytics/performance` queries ClickHouse and aggregates metrics.

### Implementation for User Story 3

- [x] T010 [US3] Create tests for ClickHouse querying in `apps/backend/test/analytics-clickhouse.spec.ts`.
- [x] T011 [US3] Refactor `apps/backend/src/analytics/analytics.controller.ts` to execute aggregations via `ClickHouseService`.

**Checkpoint**: Dashboard performance metrics are loaded dynamically from ClickHouse.

---

## Phase 6: User Story 4 - Live Telemetry & Ingestion Simulator (Priority: P2)

**Goal**: UI simulator triggers mock telemetry events dynamically.

**Independent Test**: Trigger clicks/views in UI and see analytics charts update in real-time.

### Implementation for User Story 4

- [x] T012 [US4] Implement simulator endpoint `POST /api/v1/analytics/simulate` in `apps/backend/src/analytics/analytics.controller.ts`.
- [x] T013 [US4] Integrate simulator controls and real-time updating in `apps/frontend/src/components/AnalyticsDashboard.tsx` and `apps/frontend/src/app/page.tsx`.

**Checkpoint**: End-to-end telemetry event simulation is working.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation.

- [x] T014 Run full unit/integration test suite to verify 100% pass status.
- [x] T015 Run manual verification steps in `specs/004-observability-scaling/quickstart.md`.
