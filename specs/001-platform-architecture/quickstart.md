# Quickstart and Validation Guide: Fluxora Platform Architecture

This document contains runnable validation scenarios to prove that Phase 1 platform features (tenancy isolation, secret vaulting, event streaming, and scheduling) work end-to-end.

---

## 1. Prerequisites
* Docker and Docker Compose installed.
* Node.js v20+ and npm installed.
* PostgreSQL CLI (`psql`) installed.

---

## 2. Infrastructure Setup
Spin up the backend services (Keycloak, Vault, Temporal, Kafka, PostgreSQL, ClickHouse):
```bash
docker compose -f docker-compose.infra.yaml up -d
```

---

## 3. Validation Scenarios

### Scenario 1: Tenant Row-Level Security (RLS) Verification
* **Objective**: Verify that Workspace A cannot access Workspace B transactional data.
* **Setup**: Run the SQL migration to enable RLS:
  ```bash
  psql -U postgres -d fluxora_db -f prisma/migrations/rls_init.sql
  ```
* **Execution**:
  1. Insert a mock post under `workspace_id = 'ws-A'`.
  2. Attempt a read query using setting `app.current_workspace_id = 'ws-B'`:
     ```sql
     SET app.current_workspace_id = 'ws-B';
     SELECT * FROM "Post";
     ```
* **Expected Outcome**: The query returns 0 rows. Confirming that Workspace B is blocked from viewing Workspace A data.

### Scenario 2: HashiCorp Vault Interception Validation
* **Objective**: Confirm that credentials write to Vault instead of PostgreSQL.
* **Execution**:
  1. Trigger an OAuth callback request (LinkedIn Meta Connect) via API.
  2. Run PostgreSQL query on the ConnectedAccount record:
     ```sql
     SELECT token, "vaultSecretId" FROM "ConnectedAccount" WHERE id = 'acc-1';
     ```
  3. Query Vault KV secrets API for credentials:
     ```bash
     curl -H "X-Vault-Token: dev-token" http://localhost:8200/v1/secret/data/workspaces/accounts/account-acc-1
     ```
* **Expected Outcome**:
  * PostgreSQL `token` column is NULL.
  * Vault KV secrets API returns the plaintext OAuth token.

### Scenario 3: Temporal Workflow Scheduling
* **Objective**: Confirm scheduled post dispatch durably executes.
* **Execution**:
  1. Schedule a post through the Unified Composer set 30 seconds into the future.
  2. Open Temporal Web UI: `http://localhost:8080`.
  3. Verify a workflow named `PostPublishingWorkflow` is running and entered a timer delay state.
  4. Wait 30 seconds; verify workflow state changes to "Completed" and outputs the social provider mock success.

### Scenario 4: ClickHouse Telemetry Ingestion
* **Objective**: Verify post analytics write to ClickHouse.
* **Execution**:
  1. Trigger the publishing worker to emit a `post.dispatched` event.
  2. Verify ClickHouse consumer table reads from the Kafka topic:
     ```bash
     clickhouse-client -q "SELECT count(*) FROM telemetry_events"
     ```
* **Expected Outcome**: Count increases by 1 within 1.5 seconds of event dispatch.
