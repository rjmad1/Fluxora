# Tasks: Custom Domains & Email Notifications

**Input**: Design documents from `/specs/003-custom-domains-and-notifications/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/backend/src/`, `apps/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema provisioning and migrations

- [ ] T001 Update models in `apps/backend/prisma/schema.prisma` with `customDomain`, `createdByEmail`, and `WorkspaceNotificationSettings`, then run `npx prisma migrate dev --name add_custom_domains_and_notifications`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core interceptor updates and email sandbox setup

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update `apps/backend/src/tenant/tenant.interceptor.ts` to capture hostnames, strip ports, query matching workspace custom domains, and set request-scoped tenant/workspace context.
- [ ] T003 [P] Implement `NotificationsService` in `apps/backend/src/notifications/notifications.service.ts` supporting logger and file-based sandbox output under `apps/backend/logs/mail-sandbox/`.
- [ ] T004 [P] Create `NotificationsModule` in `apps/backend/src/notifications/notifications.module.ts` exporting `NotificationsService`.
- [ ] T005 Register `NotificationsModule` in `apps/backend/src/app.module.ts`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Email Notification on Pending Approval (Priority: P1) 🎯 MVP

**Goal**: Automatically notify client with secure tokenized link when a post is submitted for approval.

**Independent Test**: Request approval token via `/approval-token` and verify a mock mail sandbox file is generated under `apps/backend/logs/mail-sandbox/` containing the client-portal link.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create tests in `apps/backend/src/publishing/publish.spec.ts` (or `apps/backend/src/publishing/approval.spec.ts` if created) verifying the notification trigger on post status change.
- [ ] T007 [US1] Inject `NotificationsService` into `apps/backend/src/publishing/approval.controller.ts` and dispatch email on status change to `PendingApproval`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Custom Domain Mapping & Routing (Priority: P1)

**Goal**: Support Dynamic custom domain resolution mapping to workspace IDs without requiring manual headers.

**Independent Test**: Mock database workspaces with custom domains, send API requests with Host headers, and verify tenant and workspace contexts match correctly.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Update unit tests in `apps/backend/src/tenant/tenant.spec.ts` to verify Host mapping resolution.
- [ ] T009 [US2] Update `apps/backend/src/tenant/tenant.service.ts` to expose workspace resolution via custom domain name.
- [ ] T010 [US2] Create custom domain configuration management page on the frontend in `apps/frontend/src/app/workspaces/[id]/domains/page.tsx`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Client Approval Decision Notification (Priority: P2)

**Goal**: Notify creator via email when client approves or rejects the post.

**Independent Test**: Submit approval/rejection decision and check written notification email files in sandbox.

### Implementation for User Story 3

- [ ] T011 [US3] Update `apps/backend/src/publishing/approval.controller.ts` to dispatch notification emails to creator upon approval or rejection.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, testing, and validation

- [ ] T012 Update `specs/003-custom-domains-and-notifications/quickstart.md` to document the completed routing and email workflows.
- [ ] T013 Run full Vitest/Jest unit and integration tests to verify all changes and run validation steps.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel
- **Polish (Final Phase)**: Depends on all user stories being complete
