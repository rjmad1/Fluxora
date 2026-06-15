# Implementation Plan: Social Adapters & Client Approval Portal

**Branch**: `002-social-adapters-and-portal` | **Date**: 2026-06-15 | **Spec**: [specs/002-social-adapters-and-portal/spec.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/specs/002-social-adapters-and-portal/spec.md)

## Summary
The goal of this plan is to transition the social media publishing layer from simulated mock publishers to real social API adapters (LinkedIn, Facebook, Twitter/X) secured by HashiCorp Vault. Additionally, we implement the Client Approval Portal MVP with tokenized approval loops.

## Technical Context

**Language/Version**: Node.js v20+, TypeScript v5.2, React v19, Next.js v15.

**Primary Dependencies**: NestJS Core, Prisma ORM, Vault Service, node-vault, KafkaJS, crypto.

**Storage**: PostgreSQL 16 (transactional data, post statuses), HashiCorp Vault (encrypted OAuth tokens).

**Testing**: Vitest/Jest for unit/integration testing of API connections and token validation.

**Target Platform**: Kubernetes (AWS EKS), Traefik ingress, Kong API Gateway.

**Project Type**: Monorepo with NestJS backend microservices and Next.js frontend dashboard.

**Performance Goals**:
- Token retrieval latency from Vault $\le 100$ms.
- Social API dispatch time $\le 3$s per platform.
- Client Portal token verification $\le 100$ms.

## Constitution Check

| Governance Gate | Status | Justification / Implementation Pattern |
|:---|:---|:---|
| **Adopt → Extend → Wrap → Fork → Build** | PASS | Using NestJS Vault client facade, standard HTTP integrations for social APIs (LinkedIn, Twitter/X, Facebook Graph API). |
| **Workflow First (Temporal)** | PASS | Incorporating approval loop state transitions and token-refresh loops as part of the Temporal Orchestrator. |
| **Sacred Tenant Isolation** | PASS | Workspace ID and Tenant context are verified inside the JWT validation and SQL query layers. |

## Project Structure

### Documentation

```text
specs/002-social-adapters-and-portal/
├── spec.md              # Feature specification
├── plan.md              # This file
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Generated tasks list
```

### Source Code to Modify

- [adapters.service.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/publishing/adapters.service.ts) — Replace mocks with real API requests.
- [publish.activities.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/publishing/publish.activities.ts) — Fetch credentials from Vault and map payload structures.
- [approval.controller.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/publishing/approval.controller.ts) — Implement API endpoints to validate review tokens, approve/reject posts, and record comments.
- [page.tsx](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/app/approval/[token]/page.tsx) — Integrate with backend to render draft content and submit reviews.
