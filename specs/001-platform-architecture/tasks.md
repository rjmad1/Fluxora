# Tasks: Fluxora Platform Architecture

**Input**: Design documents from `/specs/001-platform-architecture/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/backend/src/`, `apps/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Scaffold the monorepo structure with apps/backend and apps/frontend
- [ ] T002 Configure base NestJS dependencies in apps/backend/package.json
- [ ] T003 Configure base Next.js 15 and Tailwind CSS dependencies in apps/frontend/package.json
- [ ] T004 [P] Configure shared ESLint and Prettier configs in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Setup Prisma ORM and DB connection pooling in apps/backend/prisma/schema.prisma
- [ ] T006 [P] Configure Keycloak Connect middleware inside apps/backend/src/identity/keycloak.module.ts
- [ ] T007 Configure Kong API Gateway configurations in docker-compose.infra.yaml
- [ ] T008 [P] Initialize HashiCorp Vault transit secrets engine config in docker-compose.infra.yaml
- [ ] T009 Setup Temporal cluster connection helper in apps/backend/src/publishing/temporal.module.ts
- [ ] T010 Setup Kafka event connection in apps/backend/src/observability/kafka.module.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Tenant Workspace Provisioning (Priority: P1) 🎯 MVP

**Goal**: Establish isolated workspace boundaries for organizations.

**Independent Test**: Verify Workspace A cannot see Workspace B data in PostgreSQL tables.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create Tenant and Workspace models in apps/backend/prisma/schema.prisma
- [ ] T012 [US1] Enforce Row-Level Security policies in apps/backend/prisma/migrations/rls_init.sql
- [ ] T013 [P] [US1] Implement tenant mapping service in apps/backend/src/tenant/tenant.service.ts
- [ ] T014 [US1] Write tenant ingress validation filter in apps/backend/src/tenant/tenant.filter.ts
- [ ] T015 [US1] Build workspace manager UI board in apps/frontend/src/pages/workspaces.tsx
- [ ] T016 [US1] Write Vitest database isolation tests in apps/backend/src/tenant/tenant.spec.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Social Connection Onboarding (Priority: P1)

**Goal**: Securely connect and rotate social network OAuth credentials using HashiCorp Vault.

**Independent Test**: Confirm OAuth tokens write to Vault and database stores only references.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Add ConnectedAccount model to apps/backend/prisma/schema.prisma
- [ ] T018 [US2] Implement Vault secrets manager client in apps/backend/src/secrets/vault.service.ts
- [ ] T019 [P] [US2] Implement OAuth loop handler in apps/backend/src/secrets/oauth.controller.ts
- [ ] T020 [US2] Write Temporal token lifecycle workflow in apps/backend/src/publishing/token-refresh.workflow.ts
- [ ] T021 [US2] Write Vitest vault storage tests in apps/backend/src/secrets/vault.spec.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Social Post Orchestration & Publishing (Priority: P1)

**Goal**: Schedule and dispatch posts to LinkedIn/Facebook via Temporal workflows.

**Independent Test**: Schedule a post and verify it publishes live at the set time.

### Implementation for User Story 3

- [ ] T022 [P] [US3] Add Post and PostVariant models to apps/backend/prisma/schema.prisma
- [ ] T022b [P] [US3] Add Asset model to apps/backend/prisma/schema.prisma
- [ ] T023 [US3] Implement Temporal `PostPublishingWorkflow` scheduler in apps/backend/src/publishing/publish.workflow.ts
- [ ] T024 [P] [US3] Wrap Postiz provider libraries inside NestJS publisher in apps/backend/src/publishing/adapters.service.ts
- [ ] T024b [US3] Implement MinIO S3 media helper and Sharp/FFmpeg transcoding pipelines in apps/backend/src/asset/
- [ ] T025 [US3] Build Unified Composer calendar UI in apps/frontend/src/components/Composer.tsx
- [ ] T026 [US3] Write Playwright E2E scheduler test in apps/frontend/tests/e2e/scheduler.spec.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Telemetry & Analytics Dashboard (Priority: P2)

**Goal**: Ingest engagement telemetry from Kafka into ClickHouse and show metrics on the frontend dashboard.

**Independent Test**: Verify Kafka records show in ClickHouse client database.

### Implementation for User Story 4

- [ ] T027 [P] [US4] Setup Kafka Consumer pipe in apps/backend/src/analytics/kafka.consumer.ts
- [ ] T028 [US4] Initialize ClickHouse telemetry tables schema in apps/backend/src/analytics/clickhouse.schema.sql
- [ ] T029 [US4] Write analytics API endpoints in apps/backend/src/analytics/analytics.controller.ts
- [ ] T030 [US4] Build ClickHouse performance charts in apps/frontend/src/components/AnalyticsDashboard.tsx
- [ ] T031 [US4] Write telemetry ingestion Vitest test in apps/backend/src/analytics/telemetry.spec.ts

---

## Phase 7: User Story 5 - Client Approval Portal & Brand Compliance (Priority: P3)

**Goal**: Create external approval gates and AI brand guidelines checking loops.

**Independent Test**: Confirm external portal reviews update post queues.

### Implementation for User Story 5

- [ ] T032 [P] [US5] Build Next.js white-labeled client review portal in apps/frontend/src/pages/approval/[token].tsx
- [ ] T033 [US5] Implement Temporal `ApprovalLoopWorkflow` logic in apps/backend/src/publishing/approval.workflow.ts
- [ ] T034 [P] [US5] Implement LangGraph brand memory compliance agent in apps/backend/src/ai/brand-compliance.service.ts
- [ ] T035 [US5] Add approval actions endpoints in apps/backend/src/publishing/approval.controller.ts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T035b [P] Configure NestJS OpenTelemetry metrics and logs middleware in apps/backend/src/observability/
- [ ] T035c [P] Implement Transactional Outbox pattern interceptor for audit logging in apps/backend/src/observability/
- [ ] T036 Update docs/architecture_guidelines.md with deployment adjustments
- [ ] T037 Perform code refactoring to clean up NestJS dependencies
- [ ] T038 Conduct quickstart.md validation script runs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Tenant and Workspace models in apps/backend/prisma/schema.prisma"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready
