# Troubleshooting & Diagnostics Guide

This manual covers diagnostic workflows and remediation steps for common integration, port, and dependency conflicts.

---

## 🔌 Connection & Service Failures

### 1. HashiCorp Vault is Unreachable
* **Symptoms:** The NestJS Backend logs warning messages like: `HashiCorp Vault unreachable. Operating in local database encryption fallback mode`.
* **Causes:** Vault container is stopped, has not initialized, or is sealed.
* **Remediation:**
  - Check container state: `docker ps | grep vault`.
  - Confirm the root token matches `VAULT_TOKEN` in the `.env` configuration file.
  - If Vault was restarted, ensure it is unsealed:
    ```bash
    docker exec -it fluxora-vault vault operator unseal
    ```

### 2. Kafka / ClickHouse Connection Refused
* **Symptoms:** Backend logs connection timeouts when publishing telemetry.
* **Remediation:**
  - Verify that the telemetry fallback environment is enabled (`KAFKA_FALLBACK="true"`). The system will bypass Kafka and log events locally under `apps/backend/logs/clickhouse-sandbox/events.json`.
  - Unpause infrastructure components:
    ```bash
    npm run devflow resume
    ```

---

## ⚡ Network Port Collisions

If the `npm run devflow` launch script logs warnings about port occupancy:

### 1. Port 3000 (Backend API Server) is Busy
* **Causes:** An active NestJS or local process is bound to port 3000.
* **Remediation:**
  - Locate and stop the occupying process:
    - **Windows (CMD/PowerShell):**
      ```powershell
      Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
      ```
    - **macOS/Linux:**
      ```bash
      kill -9 $(lsof -t -i:3000)
      ```

### 2. Docker Compose Port Mappings Conflict
* **Symptoms:** Docker Compose fails to start database containers with bind conflicts.
* **Remediation:**
  - Verify that no other databases are running locally on the host ports (e.g. native PostgreSQL on `5432` or Redis on `6379`).
  - Modify the public host port mapping in the root `docker-compose.yaml` (e.g., redirecting host port `54321` to a different number).

---

## 🧩 Dependency & Prisma Migration Locks

### 1. Prisma Migration Engine Lock
* **Symptoms:** Prisma CLI hangs during migration deployments.
* **Remediation:**
  - Connect to PostgreSQL directly and remove lock rows:
    ```sql
    DELETE FROM "_prisma_migrations" WHERE "finished_at" IS NULL;
    ```

### 2. Workspace Dependencies Mismatch
* **Symptoms:** Compile errors like `cannot find module` after doing a git pull.
* **Remediation:**
  - Clean and rebuild workspace packages:
    ```bash
    npm run format
    npm ci
    npx prisma generate --schema=apps/backend/prisma/schema.prisma
    ```
