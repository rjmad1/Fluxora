# Tasks: Social Adapters & Client Approval Portal

**Input**: Design documents from `/specs/002-social-adapters-and-portal/`

**Prerequisites**: plan.md (required), spec.md (required)

---

## Phase 1: Database & Model Refactoring

- [x] T001 Add `feedback` optional field to the `Post` model in `apps/backend/prisma/schema.prisma` and run Prisma migrations.

---

## Phase 2: Social API Adapter Integrations

- [x] T002 Refactor `SocialAdaptersService` in `apps/backend/src/publishing/adapters.service.ts` to implement standard API dispatch requests to LinkedIn, Facebook, and Twitter/X endpoints using native Node.js `fetch` and handle rate limits (HTTP 429) properly.

---

## Phase 3: Publishing Worker Vault Connections

- [x] T003 Ensure that `PublishActivities` in `apps/backend/src/publishing/publish.activities.ts` correctly fetches tokens from `VaultService` and invokes the updated social adapters with the fetched credentials.

---

## Phase 4: Tokenized Approval API Development

- [x] T004 Build JWT/HMAC token signing, validation, and review submit API routes in `apps/backend/src/publishing/approval.controller.ts`.
- [x] T005 Wire the approval endpoints to the database using `PrismaService` to update post status (`Scheduled` or `Draft`) and store comments.

---

## Phase 5: Client Portal Next.js Integration

- [x] T006 Update the Next.js approval page in `apps/frontend/src/app/approval/[token]/page.tsx` to retrieve post details from the backend and dispatch approval/rejection operations.

---

## Phase 6: Testing & Quality Verification

- [x] T007 Write unit and integration tests verifying the approval transition endpoints and Vault API client credentials pipeline.
- [x] T008 Run the backend test suites to confirm zero regressions.
