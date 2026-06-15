# Implementation Plan: Custom Domains & Email Notifications

**Branch**: `003-custom-domains-and-notifications` | **Date**: 2026-06-15 | **Spec**: [specs/003-custom-domains-and-notifications/spec.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/specs/003-custom-domains-and-notifications/spec.md)

**Input**: Feature specification from `/specs/003-custom-domains-and-notifications/spec.md`

## Summary

This plan covers implementing email notification alerts for the post client-approval flow (sending dynamic client portal links on pending approval and notifying creators on client decisions) and routing requests automatically from custom domain hostnames to their corresponding database workspaces, enforcing tenant isolation context.

## Technical Context

**Language/Version**: Node.js v20+, TypeScript v5.2, NestJS v11, Next.js v15

**Primary Dependencies**: NestJS Core, Prisma ORM, Keycloak Connect SDK, crypto

**Storage**: PostgreSQL 16

**Testing**: Jest for backend unit/integration tests

**Target Platform**: Kubernetes / Kong API Gateway

**Project Type**: Monorepo with NestJS backend microservices and Next.js frontend dashboard.

**Performance Goals**: Dynamic custom domain resolution latency < 1ms, email trigger latency < 100ms.

**Constraints**: Strict compliance with Row-Level Security (RLS) workspace boundaries.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Governance Gate | Status | Justification / Implementation Pattern |
|:---|:---|:---|
| **Adopt → Extend → Wrap → Fork → Build** | PASS | Reuses existing `TenantInterceptor` for workspace resolution. Simulates notification service locally via local logs/sandbox before adopting production APIs (e.g. Resend). |
| **Build Domains, Not Features** | PASS | Extends Tenant domain (workspace customDomain attributes) and Publishing/Notifications domain logic. |
| **Sacred Tenant Isolation** | PASS | Host header resolution maps to specific `workspaceId` and `tenantId` database rows, ensuring RLS context is correctly bound for all queries. |

## Project Structure

### Documentation (this feature)

```text
specs/003-custom-domains-and-notifications/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (generated tasks list)
```

### Source Code to Modify

```text
apps/
├── backend/
│   ├── src/
│   │   ├── tenant/
│   │   │   ├── tenant.interceptor.ts  # Inspect Host header and map to workspaceId
│   │   │   └── tenant.service.ts      # Cache or resolve domain mapping
│   │   ├── notifications/             # [NEW] Email notification module and services
│   │   └── publishing/
│   │       └── approval.controller.ts # Trigger email notifications on state changes
│   └── prisma/
│       └── schema.prisma              # Update DB models for customDomain and email attributes
│
└── frontend/
    └── src/
        └── app/
            └── workspaces/
                └── [id]/
                    └── domains/
                        └── page.tsx   # [NEW] Custom domain configuration panel
```

**Structure Decision**: Web application (monorepo frontend + backend). Custom domain mapping is handled dynamically in the backend `TenantInterceptor`.

## Complexity Tracking

*No constitution violations are present; the architecture conforms to standard NestJS design.*
