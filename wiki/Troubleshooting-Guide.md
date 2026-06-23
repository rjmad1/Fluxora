# Troubleshooting Guide

This guide compiles common runtime error patterns, infrastructure connectivity issues, and resolution runbooks for the Fluxora platform.

---

## 🚨 Social Profile Disconnections

### Symptom:
A post variant fails publication with the log message:
`Platform publish failed for linkedin: Invalid access token`

### Root Cause:
* The user revoked OAuth access permissions from the platform console.
* The access token has expired and the refresh token is expired or revoked.

### Resolution Steps:
1. Navigate to the Workspace connected accounts dashboard.
2. Select the failed account and click **Reconnect Profile**.
3. Re-authenticate via the OAuth consent flow, which generates a new token stored in Vault.
4. Locate the failed post and click **Retry Publication** to trigger the Temporal workflow.

---

## 🔒 Credential Locks & Vault Failures

### Symptom:
`Failed to read credentials from HashiCorp Vault: Status 503 / Raft Leases Sealed`

### Root Cause:
* The Vault container restarted and returned to its default sealed state.
* The dev root token is invalid or expired.

### Resolution Steps:
1. Inspect the Vault status:
   ```bash
   docker compose exec vault vault status
   ```
2. If `Sealed` is `true`, execute unseal operations:
   ```bash
   docker compose exec vault vault operator unseal <unseal-key-1>
   ```
   *(Note: In local development, the container starts unsealed via dynamic dev-token `fluxora-dev-token`).*
3. Verify the NestJS Vault client configuration in `.env`:
   `VAULT_TOKEN=fluxora-dev-token`

---

## ⏳ Social API Rate Limits & Staggers

### Symptom:
`HttpException: LinkedIn API Rate Limit Exceeded. Anti-ban stagger triggered.`

### Root Cause:
* High-volume posting in a short period triggers rate limit thresholds.
* The staggering interval between platforms was set to zero.

### Resolution:
1. Ensure the **Distribution Intelligence Engine** has staggers configured (default: 5-minute offsets).
2. The Temporal worker automatically catches the `429` status code and applies an exponential backoff (retrying up to 5 times over 1 hour).
3. If rate limits persist, update the scheduling presets to spread post publications over wider slots.

---

## 📊 ClickHouse & Telemetry Ingestion Failures

### Symptom:
Analytics dashboard has missing or delayed metric charts, or telemetry events are not displaying.

### Root Cause:
* Apache Kafka brokers are down or unreachable, causing the backend to write to local filesystem logs (under fallback mode).
* ClickHouse server is offline, so the background telemetry consumer cannot flush event batches.
* The consumer group lag is growing due to database write backpressure.

### Resolution Steps:
1. Check container health status of core services:
   ```bash
   docker compose ps
   ```
2. Verify Kafka connection from host using local advertised port `29092` or from within the container. If Kafka is down, verify if the backend is logging fallback JSON files under `apps/backend/logs/clickhouse-sandbox/` (if `KAFKA_FALLBACK="true"` is configured).
3. Once Kafka is back up, synchronize the sandbox fallback logs back into ClickHouse:
   ```bash
   npm run db:telemetry:sync-sandbox
   ```
4. Test ClickHouse endpoint connectivity:
   ```bash
   curl http://localhost:8124/ping
   ```
5. If ClickHouse is throwing database connection errors, verify database existence and client credentials in the backend environment setup.

