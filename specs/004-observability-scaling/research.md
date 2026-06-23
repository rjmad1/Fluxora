# Research: Enterprise Observability & Scaling

This document details the architectural research and decisions for integrating Apache Kafka and ClickHouse telemetry pipelines in Fluxora.

## Event Broker Selection (Apache Kafka)

- **Decision**: Adopt a single-node Apache Kafka broker using KRaft mode for local development, and the `kafkajs` client library for NestJS integration.
- **Rationale**: Kafka is the industry-standard high-throughput event mesh required by the Fluxora Platform Constitution (Principle IV). Using KRaft (Kafka Raft metadata mode) eliminates the dependency on Zookeeper, reducing local development footprint and startup time.
- **Alternatives considered**: 
  - *RabbitMQ*: Rejected because the Constitution specifically mandates Apache Kafka as the event mesh transport.
  - *BullMQ (Redis)*: Already adopted for local scheduling/publishing queues, but does not provide the persistent event-log streaming and high-volume multi-consumer replay capabilities of Kafka.

 ## Telemetry Database Selection (ClickHouse)

- **Decision**: Adopt the existing ClickHouse HTTP API interface via native Node.js `fetch` queries, and insert events in line-delimited JSONEachRow format.
- **Rationale**: ClickHouse is a fast columnar database designed for high-performance time-series aggregations (Principle II). Using ClickHouse's HTTP API (port 8123) over `fetch` avoids adding native driver dependencies like `@clickhouse/client` which increase build complexity and compile time. It is highly lightweight and works natively in Node.js v20+.
- **Alternatives considered**:
  - *Prisma/PostgreSQL for Analytics*: Rejected because PostgreSQL is a row-oriented transactional database; running massive telemetry aggregation queries degrades system performance and violates the Constitution's separation of concerns (Assumption A-003).
  - *Official ClickHouse NodeJS Client*: Evaluated but rejected as an unnecessary dependency since the HTTP REST interface is fully capable, faster to mock, and highly reliable.

## Offline/Local Fallback and Dev Sandbox

- **Decision**: Implement a dynamic fallback system. If Kafka or ClickHouse are offline, or if the system is configured in dev/test fallback mode, the backend writes telemetry events to a local JSON sandbox file at `apps/backend/logs/clickhouse-sandbox/events.json`. The dashboard queries read directly from this file to aggregate metrics.
- **Rationale**: Ensures that developers can work offline, run tests without Docker services running, and still fully validate the frontend dashboard aggregation logic.
- **Alternatives considered**:
  - *Requiring Docker containers to run for unit tests*: Rejected because it slows down CI/CD pipelines and disrupts developer productivity when running tests offline.
