# Feature Specification: Enterprise Observability & Scaling

**Feature Branch**: `004-observability-scaling`

**Created**: 2026-06-15

**Status**: Implemented

**Input**: User description: "Implement Wave 3: Enterprise Observability and Scaling - Kafka and ClickHouse telemetry integration"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Telemetry Event Stream Auditing (Priority: P1)

When a social media post undergoes status transitions (e.g., scheduled, publishing, dispatched), or when post-engagement events occur (clicks, views), the platform automatically publishes telemetry events to a high-throughput event message stream. If the event broker is temporarily down or offline in development, the system fails gracefully by writing events to a fallback log and allowing operations to continue.

**Why this priority**: Scaffolding the event publishing pipeline is the necessary first step to decouple transactional state updates from telemetry/observability data streams.

**Independent Test**: Trigger a post status change (e.g., save a post draft as scheduled or publish it) and verify that the system emits a corresponding event matching the post context to the event streaming topic, falling back gracefully if the stream is unreachable.

**Acceptance Scenarios**:
1. **Given** a post variant is being published, **When** the publishing workflow runs, **Then** the system publishes a `post.publishing` telemetry event to the message topic.
2. **Given** a post variant is successfully published, **When** the confirmation is received, **Then** the system publishes a `post.dispatched` telemetry event to the message topic.
3. **Given** the message broker is offline, **When** a publishing action occurs, **Then** the system logs the telemetry event to a local system log without throwing an error or blocking the post publishing execution.

---

### User Story 2 - High-Throughput Analytics Ingestion & Persistence (Priority: P1)

An analytics consumer processes incoming telemetry events from the event message stream and writes them to a dedicated analytics columnar database. To optimize write throughput and avoid locking the database, the consumer batches events in groups (e.g., every 1 second or every 1,000 events) rather than writing them individually.

**Why this priority**: Columnar databases require batching to prevent file system degradation and write lockouts under high load. This completes the stream-to-database ingestion pipeline.

**Independent Test**: Generate a batch of telemetry events in the message topic, and verify that they are consumed, formatted, and inserted into the analytics database table as structured records.

**Acceptance Scenarios**:
1. **Given** a stream of 100 incoming telemetry events, **When** the consumer receives them, **Then** the consumer batches them and executes a single bulk insert query into the analytics database.
2. **Given** the analytics database is offline, **When** the consumer attempts to write a batch, **Then** the consumer retains the events in-memory or logs the failure, retrying the ingestion once the database is back online.

---

### User Story 3 - High-Speed Performance Analytics Dashboard (Priority: P2)

An Agency Admin or Creator views the workspace performance dashboard to track their social campaigns. The backend API serving the dashboard queries the analytics database directly instead of executing heavy aggregation queries on the PostgreSQL transactional database, ensuring the page loads instantly.

**Why this priority**: Separates transactional and analytical concerns, ensuring that high-volume analytics queries do not degrade PostgreSQL query performance.

**Independent Test**: Send a GET request to the analytics performance endpoint for a workspace, and verify that the response returns the aggregated counts (views, clicks, shares) fetched directly from the analytics database.

**Acceptance Scenarios**:
1. **Given** a workspace with 1,000 telemetry events in the analytics database, **When** the admin loads the performance dashboard, **Then** the backend queries the analytics database and returns the aggregated metrics in under 500ms.
2. **Given** a request for analytics, **When** no telemetry records exist for that workspace, **Then** the dashboard returns zero counts for all metrics without throwing an error.

---

### User Story 4 - Live Telemetry & Ingestion Simulator (Priority: P2)

A developer or dashboard user wants to test the analytics pipeline in real time. The frontend settings page includes a "Telemetry Ingestion Simulator" form. The user can select a platform (LinkedIn, Twitter, Facebook) and an action type (View, Click, Share), and click "Simulate Event". The event is pushed to the ingestion pipeline, and the dashboard metrics update dynamically.

**Why this priority**: Enables easy manual verification, demonstration of the event-driven telemetry flow, and automated E2E integration testing.

**Independent Test**: Access the simulation panel on the frontend, click "Simulate Click" on LinkedIn multiple times, and verify that the corresponding chart and count update accordingly on the analytics dashboard.

**Acceptance Scenarios**:
1. **Given** the analytics dashboard is open, **When** a user submits a simulated click event via the simulator, **Then** the backend pushes a simulated telemetry event, and the frontend updates its displayed counts to reflect the new event.

---

## Edge Cases

- **Broker Connection Failures**: If the message broker (Kafka) cannot connect, the backend must transition to a mock/fallback mode in development so that tests and local development don't block.
- **ClickHouse Batch Timeout**: If the batch size of 1,000 events is not reached, the consumer must flush the accumulated events after a timeout (e.g., 1 second) to prevent data from being delayed indefinitely on quiet workspaces.
- **Tenant Context Validation**: Ensure that ClickHouse analytics queries strictly filter by `workspaceId` to prevent cross-workspace data leaks, mirroring the PostgreSQL RLS rules.
- **Port and Host Mismatch**: When running in Docker versus local hosts, ensure the ClickHouse and Kafka client configuration uses dynamic environment variables with reliable defaults.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST publish telemetry events (type: `post.publishing`, `post.dispatched`, `post.click`, etc.) to a message topic named `fluxora.telemetry.events`.
- **FR-002**: System MUST run a background consumer that listens to the message topic and stores incoming telemetry events in a ClickHouse database table.
- **FR-003**: The consumer MUST write events to ClickHouse using bulk inserts (batching every 1,000 events or 1 second, whichever comes first).
- **FR-004**: The analytics controller `/api/v1/analytics/performance` MUST query ClickHouse instead of PostgreSQL to fetch views, clicks, and shares metrics.
- **FR-005**: ClickHouse analytics queries MUST strictly enforce `workspaceId` filtering.
- **FR-006**: In development and testing environments, the system MUST support a fallback mode where telemetry is written to/read from a local sandbox JSON file/directory (`apps/backend/logs/clickhouse-sandbox/`) if Kafka/ClickHouse services are not connected.
- **FR-007**: Frontend dashboard MUST provide a simulator panel to submit mock views, clicks, and shares to the telemetry API.

### Key Entities

- **TelemetryEvent** (stored in ClickHouse):
  - `id` (String / UUID)
  - `workspaceId` (String, indexed)
  - `postId` (String)
  - `platform` (String)
  - `eventType` (String)
  - `timestamp` (DateTime)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ingestion latency from the emission of a telemetry event to its availability in ClickHouse is under 1,500ms.
- **SC-002**: Analytics dashboard aggregation queries on ClickHouse return results in under 500ms.
- **SC-003**: 100% of telemetry queries explicitly filter by `workspaceId` to maintain strict tenant separation.
- **SC-004**: Fallback log sandbox works correctly in offline development, maintaining 100% test coverage and passage without requiring external Docker services running.

## Assumptions

- We assume that standard Kafka and ClickHouse Docker containers can be added/integrated in local environment setups.
- The ClickHouse table schema will be managed by a database initialization script or NestJS lifecycle hook rather than standard Prisma migrations (Prisma does not support ClickHouse directly).
- The system defaults to the fallback sandbox when environment variables like `KAFKA_BROKERS` or `CLICKHOUSE_URL` are not provided.
