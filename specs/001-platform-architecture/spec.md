# Feature Specification: Fluxora Platform Architecture

**Feature Branch**: `001-platform-architecture`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Create a platform architecture specification for Fluxora based on the executive summary and gap analysis, establishing a Workflow-Centric Event-Driven Multi-Tenant Social Distribution Operating System using selective Postiz components and new OSS/SaaS integrations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Tenant Workspace Provisioning (Priority: P1)

An Agency Administrator logs into Fluxora and sets up an isolated workspace for a new client. This workspace must have its own isolated database access scope, assets, and branding rules, fully isolated from other clients.

**Why this priority**: Enterprise multi-tenancy and workspace isolation are the core foundations of the platform, enabling agency and SaaS monetization models.

**Independent Test**: Can be verified by creating two distinct tenants/workspaces in the admin panel and ensuring that users and assets from Tenant A cannot see, access, or modify any resources belonging to Tenant B.

**Acceptance Scenarios**:

1. **Given** a new agency client onboarding flow, **When** the Agency Admin creates a workspace, **Then** a new workspace ID is generated, default roles are initialized in Keycloak, and the tenant context is propagated to PostgreSQL.
2. **Given** two active workspaces, **When** a user in Workspace A queries assets or social connections, **Then** no assets or credentials from Workspace B are returned.

---

### User Story 2 - Social Connection Onboarding (Priority: P1)

A Marketing Manager connects the agency's client LinkedIn, Facebook, and X (Twitter) accounts to the Fluxora workspace. The authentication flow uses OAuth, and credentials are saved securely.

**Why this priority**: Essential to verify that the social connectivity adapters (selectively reused from Postiz) can connect, authenticate, and monitor token health within our secure architecture.

**Independent Test**: Can be verified by executing the OAuth authentication redirect loop for a test LinkedIn or Facebook account and confirming that tokens are stored and successfully validated.

**Acceptance Scenarios**:

1. **Given** a user triggers LinkedIn connection, **When** they complete the OAuth flow, **Then** the access and refresh tokens are stored securely in HashiCorp Vault, and the account status is marked active in the database.
2. **Given** an active connection token, **When** the token health cron monitors the token, **Then** it validates the token lifecycle and schedules a Temporal refresh workflow before token expiration.

---

### User Story 3 - Social Post Orchestration & Publishing (Priority: P1)

A Content Creator drafts a social post with variants for LinkedIn and X, schedules it for next Tuesday, and saves it. The system automatically schedules and dispatches the post at the right time.

**Why this priority**: Focuses on core publishing, scheduling, and distribution engines using Temporal workflows and Kafka events.

**Independent Test**: Can be verified by scheduling a post, verifying a Temporal workflow is created, and validating that the post is successfully dispatched via the social adapter at the correct time.

**Acceptance Scenarios**:

1. **Given** a scheduled post, **When** the scheduled time is reached, **Then** the Temporal scheduler workflow triggers, publishes a `post.dispatched` event to Kafka, and the respective social adapter executes the API publishing calls.
2. **Given** an adapter API failure, **When** the dispatch engine returns a rate-limit error, **Then** the Temporal workflow captures the error, applies the anti-ban/stagger engine backoff, and schedules a retry.

---

### User Story 4 - Telemetry & Analytics Dashboard (Priority: P2)

An Account Director views the analytics dashboard to monitor post performance (views, clicks, impressions) and agency operational velocity.

**Why this priority**: Validates the end-to-end Kafka telemetry ingestion and ClickHouse analytics engine, separating transaction processing from high-volume analytical queries.

**Independent Test**: Can be verified by simulating post-engagement events, ingesting them through Kafka, storing them in ClickHouse, and verifying the dashboard queries return the correct aggregated data.

**Acceptance Scenarios**:

1. **Given** user interactions on published posts, **When** telemetry events are emitted, **Then** they stream through Kafka and are bulk-loaded into ClickHouse within 1 second.
2. **Given** ClickHouse database queries, **When** the analytics dashboard is loaded, **Then** the system returns aggregated engagement metrics with sub-second response time.

---

### User Story 5 - Client Approval Portal & Brand Compliance (Priority: P3)

A Content Specialist creates a post draft for a client. Before it is scheduled or published, the client receives an email, reviews the draft in a white-labeled portal, and approves or rejects it with feedback.

**Why this priority**: Specifically exercises the Agency OS capabilities and AI brand compliance checks.

**Independent Test**: Can be verified by transitioning a post to "Pending Approval", generating a secure client portal link, and verifying the client can approve the post, which moves it to "Scheduled" status.

**Acceptance Scenarios**:

1. **Given** a post draft requires client approval, **When** the user requests review, **Then** the post enters a pending state, a Temporal approval workflow initializes, and an email notification containing a secure portal link is sent to the client.
2. **Given** a client portal link, **When** the client approves the post, **Then** the system executes the Temporal state transition, schedules the post, and emits `approval.granted`.

---

### Edge Cases

- **Token Revocation / Expired State**: If a social token is revoked by the platform or user during a scheduled run, the dispatch workflow must fail gracefully, alert the workspace managers, and move the post to a "Needs Reconnection" state rather than failing silently or retrying indefinitely.
- **Social Platform Rate Limits / Bans**: If LinkedIn or X returns rate limits or IP restrictions, the distribution engine must dynamic-stagger subsequent posts and route them through alternative proxy layers or delay executions.
- **Temporal/Kafka Disconnections**: If the Kafka event mesh is briefly unavailable, the publishing pipeline must fall back to transactional outbox patterns in PostgreSQL to ensure no messages are lost.

## Requirements *(mandatory)*

### Functional Requirements

#### Domain 1: Identity & Tenant Management
- **FR-001**: System MUST enforce complete multi-tenant isolation at the database (PostgreSQL schemas/row-level filtering) and event levels.
- **FR-002**: System MUST integrate Keycloak for authentication, authorization (RBAC/ABAC), SAML SSO, and SCIM provisioning.
- **FR-003**: System MUST include a tenant onboarding and workspace creation flow.

#### Domain 2: Social Network Connectivity
- **FR-004**: System MUST manage OAuth connection flows and store credentials securely in HashiCorp Vault.
- **FR-005**: System MUST validate social connection health and perform background token refreshes automatically.
- **FR-006**: System MUST wrap and extend Postiz social adapters for LinkedIn, Facebook, Instagram, X (Twitter), and TikTok.

#### Domain 3: Content Operations
- **FR-007**: System MUST provide a unified composer supporting network-specific content variants, presets, signatures, and templates.

#### Domain 4: Digital Asset Management (DAM)
- **FR-008**: System MUST support an asset library with metadata tagging, search, and minio storage.
- **FR-009**: System MUST provide media processing (Sharp for images, FFmpeg pipeline for video) to generate social network-compliant asset variants.

#### Domain 5: Scheduling & Distribution Engine
- **FR-010**: System MUST execute durable scheduling, dispatch, rate-limiting, and stagger operations using Temporal workflows.
- **FR-011**: System MUST support queues, retry handling, and dead-letter queue routing for post dispatches.

#### Domain 6: Workflow Automation
- **FR-012**: System MUST provide approval workflows for campaigns, drafts, and client reviews.

#### Domain 7: Analytics Platform
- **FR-013**: System MUST ingest engagement telemetry via Kafka and store in ClickHouse for high-throughput time-series analytics.

#### Domain 8: AI Platform
- **FR-014**: System MUST orchestrate AI copy generation, image refinement, best-time scheduling recommendations, and brand policy compliance via an LLM router.

#### Domain 9: Agency Operations
- **FR-015**: System MUST support custom domains, white-labeled client portals, and workspace-level client approval gates.

#### Domain 10: Platform Operations
- **FR-016**: System MUST enforce security compliance: audit trails, encryption at rest, encryption in transit, and token lifecycle management.
- **FR-017**: System MUST output OpenTelemetry, Prometheus, and Loki formats for observability.

### Key Entities

- **Tenant**: An enterprise or agency account representing the highest billing and administration boundary.
- **Workspace**: An isolated environment within a tenant representing a specific client, brand, or project.
- **User**: System user authenticated via Keycloak, assigned workspace-specific roles.
- **ConnectedAccount**: Social account OAuth credentials and connectivity status linked to a workspace (credentials stored in Vault).
- **Post**: A scheduled or published content package containing multiple platform-specific variant objects.
- **Asset**: Media asset in MinIO with generated variant files (crops, transcodings).
- **TemporalWorkflowState**: Stateful record of scheduled dispatches and active approval loops.
- **TelemetryEvent**: Time-series performance metrics (clicks, views, etc.) stored in ClickHouse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of API endpoints and database tables enforce `tenant_id` and `workspace_id` isolation.
- **SC-002**: 100% of sensitive API keys and OAuth tokens are stored in HashiCorp Vault.
- **SC-003**: Ingestion latency for telemetry from event emission to ClickHouse insertion is under 1,500 milliseconds.
- **SC-004**: Post dispatch execution triggers within +/- 15 seconds of the scheduled epoch (excluding intentional stagger delays).
- **SC-005**: 100% of image/video assets uploaded are transcoded and cropped to social network-compliant formats within 10 seconds.

## Assumptions

- **A-001**: Keycloak, HashiCorp Vault, Apache Kafka, ClickHouse, MinIO, and Temporal are available as platform services.
- **A-002**: Postiz social adapters can be decoupled from the original Postiz repository structure and integrated into NestJS backends.
- **A-003**: The primary analytical queries will be handled by ClickHouse, leaving PostgreSQL strictly for transactional SaaS metadata.
- **A-004**: Custom domains and white-labeling will be supported via a reverse proxy (Kong/Traefik routing layers).
