# Research and Architecture Decisions: Fluxora Platform Architecture

This document resolves the key technical context questions and provides justifications for major technology selections.

---

## 1. Identity & Auth Service Integration (Keycloak)
* **Decision**: Adopt **Keycloak** (OIDC client) for user registration, user metadata storage, and role-based access control (RBAC). Sync user and organization metadata to PostgreSQL via webhook event hooks.
* **Rationale**: Eliminates developer maintenance burden of building custom registration forms, SSO integration, SAML compliance gates, and MFA screens. Leverages Red Hat enterprise-supported security patterns.
* **Alternatives considered**:
  * *Auth0/Clerk (SaaS)*: Rejected due to API subscription cost and vendor lock-in risk.
  * *Custom NestJS Auth*: Rejected due to maintenance overhead and lack of out-of-the-box SAML SSO support.

## 2. Secrets Management (HashiCorp Vault)
* **Decision**: Deploy **HashiCorp Vault** using the Transit Secrets Engine for OAuth credential encryption/decryption, storing only references in PostgreSQL.
* **Rationale**: Moving credentials out of transactional databases limits the blast radius of SQL injections or SQL server backups.
* **Alternatives considered**:
  * *Prisma Database Encryption*: Rejected due to high risk of key leak in server configuration profiles.
  * *AWS Secrets Manager*: Rejected due to cost bounds at scale when managing millions of dynamically rotating client connection tokens.

## 3. Durable Execution (Temporal)
* **Decision**: Adopt **Temporal Workflow Engine** for publishing schedulers, retry loops, and token rotation activities.
* **Rationale**: Temporal provides visually traceable state machines, automatic retry backoffs, and durable execution state, eliminating lost post dispatches due to server terminations or database drop-offs.
* **Alternatives considered**:
  * *BullMQ (Redis)*: Rejected because BullMQ queues are in-memory (loss risk if Redis runs out of memory) and require custom code for complex retry/stagger flows.
  * *AWS Step Functions*: Rejected due to local developer environment nesting friction and high pay-per-transition hosting costs.

## 4. Telemetry and Analytics Pipeline (Kafka & ClickHouse)
* **Decision**: Stream telemetry events via **Apache Kafka** and bulk load them directly into **ClickHouse** columnar engines using Kafka tables.
* **Rationale**: Decouples read/write analytical loads from transactional PostgreSQL. ClickHouse aggregates millions of rows in sub-second timelines.
* **Alternatives considered**:
  * *PostgreSQL Aggregations*: Rejected due to database lock bottlenecks when scaling to thousands of concurrent analytics queries.
  * *TimescaleDB*: Rejected because ClickHouse exhibits better vectorized query performance for analytical dashboard loads.

---

## 5. Resolution of Open Questions (Clarifications)

### 1. Reverse Proxy Hosting Limits (Kong Gateway)
* **Decision**: For Phase 1, cap white-labeled custom domains at 100 configurations routed dynamically through Traefik ingress header mapping.
* **Rationale**: Keeps setup simple, avoiding Enterprise gateway licenses while satisfying immediate agency pilot requirements.

### 2. TikTok API Sandbox Licensing
* **Decision**: Utilize standard TikTok Developer Sandbox accounts for Wave 1/2 developer tests, delaying official business verification until Wave 3 staging.
* **Rationale**: Prevents legal verification cycles from blocking the critical path of the omnichannel publishing MVP.

### 3. GDPR Regional Data Sovereignty
* **Decision**: Single-region AWS hosting in `us-east-1` for Phase 1 Beta. Design schema to support optional `data_region` field mappings on Tenant records for future regional routing configurations.
* **Rationale**: Avoids multi-region PostgreSQL cluster setup complexity while maintaining a clear upgrade path.
