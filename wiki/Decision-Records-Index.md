# Decision Records Index

This index logs the Architectural Decision Records (ADRs) that govern the Fluxora platform's technical stack and patterns.

---

## 🏛️ Architectural Decision Records (ADR)

### [ADR-001] Adopt Keycloak for Identity, Authentication & RBAC
* **Status**: Ratified (2026-06-15)
* **Context**: Postiz baseline codebase uses custom cookie-based sessions, which lack enterprise-grade SCIM provisioning, SSO, and federated directory integration.
* **Decision**: Deprecate custom session authentication; adopt Keycloak with NestJS Keycloak Connect SDK to manage access control.
* **Consequence**: Zero-trust authentication paths managed by OIDC; users sync to PostgreSQL via webhook listeners.

### [ADR-002] Adopt HashiCorp Vault for OAuth Token Management
* **Status**: Ratified (2026-06-15)
* **Context**: Storing social media access tokens in transactional relational databases creates massive legal liabilities in multi-tenant SaaS environments.
* **Decision**: Adopt HashiCorp Vault (KV-v2 engine) to store access/refresh tokens. PostgreSQL only retains a reference path pointer (`vaultSecretId`).
* **Consequence**: Eliminates plain-text credential leaks via PostgreSQL SQL injection vectors. Requires unsealing procedures during cluster provisioning.

### [ADR-003] Adopt Temporal for Durable Execution & Scheduling
* **Status**: Ratified (2026-06-15)
* **Context**: BullMQ cron scheduling lacks transaction durability guarantees, visual traces, and distributed saga error boundaries.
* **Decision**: Adopt Temporal Workflow Engine for scheduling, token refresh cycles, and approval loops. Keep BullMQ only as a local/development fallback.
* **Consequence**: Guarantees post-dispatch actions survive container restarts; provides full visibility into retry backoffs and delay states.

### [ADR-004] Decouple Ingestion Analytics to Kafka & ClickHouse
* **Status**: Ratified (2026-06-15)
* **Context**: Direct analytical aggregation queries on high-throughput transactional database tables degrade PostgreSQL read/write capacity.
* **Decision**: Emits all views/clicks/publishing updates to Kafka event mesh; ingests events into ClickHouse columnar storage for dashboard metrics.
* **Consequence**: Transactional databases are isolated from analytics overhead. Telemetry dashboard queries execute in under 500ms.
