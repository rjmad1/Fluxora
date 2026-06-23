# Operations Guide (Runbook)

This operations guide defines system validation procedures, recovery runs, database management, and active troubleshooting scripts.

---

## 🚦 System Port & Endpoint Matrix

| Port (Host) | Service | Access Endpoint / Health Check |
| :--- | :--- | :--- |
| `54321` | PostgreSQL | `pg_isready -h localhost -p 54321 -U postgres -d fluxora_db` |
| `8081` | Keycloak IAM | `http://localhost:8081/realms/master/.well-known/openid-configuration` |
| `8200` | HashiCorp Vault | `curl http://localhost:8200/v1/sys/health` (Checks seal status) |
| `29092` | Apache Kafka | `/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` (inside container) |
| `8124` | ClickHouse | `wget -qO- http://localhost:8124/ping` (Checks HTTP endpoint) |
| `7233` | Temporal Server | `http://localhost:8082` (Temporal Console dashboard) |
| `8002` | Kong API Gateway| `http://localhost:8003/status` (Admin Status API on port 8003) |

---

## 📝 Runtime Operations Runbook

### Runbook 1: Kafka Telemetry Down & Offline Fallback
If the Kafka cluster becomes unreachable, NestJS services will automatically fall back to the **local sandbox logging mode** if `KAFKA_FALLBACK="true"` is set.
* **Log Directory**: `apps/backend/logs/clickhouse-sandbox/`
* **Recovery Procedure**:
  1. Verify connection status using:
     ```bash
     docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
     ```
  2. Once the brokers are resolved, restart the NestJS server to reconnect. The fallback buffer writes telemetry events locally as JSON logs, which can be re-imported using the ingestion script:
     ```bash
     npm run db:telemetry:sync-sandbox
     ```

### Runbook 2: ClickHouse Buffer Flush
ClickHouse inserts are batched to optimize performance (1,000 events or 1s intervals).
If you need to force-flush events cached in the background consumer:
1. Issue a POST request to the simulation endpoint to force flushing:
   ```bash
   curl -X POST http://localhost:8002/api/v1/analytics/simulate \
     -H "Content-Type: application/json" \
     -d '{"platform":"linkedin", "eventType":"post.click", "workspaceId":"test-id"}'
   ```
2. Or query ClickHouse directly to verify counts:
   ```bash
   curl http://localhost:8124/ -d "SELECT count() FROM telemetry_events"
   ```

### Runbook 3: HashiCorp Vault Key Rotation
To rotate the local database encryption fallback key (or Vault Transit key):
1. Retrieve the current key version status via Vault CLI:
   ```bash
   vault write -f secret/data/workspaces/accounts/keys/rotate
   ```
2. In NestJS, update the `ENCRYPTION_KEY` environment variable with the new 32-byte hex key in your Docker Compose file or Kubernetes Secrets config. The fallback logic will automatically handle standard decryption cycles for older payloads using previous versions.

---

## 🗄️ Backup & Restore Procedures

### 1. PostgreSQL Metadata DB Backup
Execute daily backups of the transactional SaaS configuration schemas:
```bash
# Backup
pg_dump -U postgres -d fluxora_db -F c -b -v -f /backups/fluxora_db_$(date +%F).backup

# Restore
pg_restore -U postgres -d fluxora_db -v /backups/fluxora_db_2026-06-15.backup
```

### 2. HashiCorp Vault Configurations Backup
Vault storage volumes are persistent. Back up the Vault raft snapshot:
```bash
vault operator raft snapshot save /backups/vault_raft_$(date +%F).snap
```

### 3. ClickHouse Columns Archive
ClickHouse data partitions can be frozen and detached for offline archival:
```bash
# Freeze partition
clickhouse-client --query "ALTER TABLE telemetry_events FREEZE PARTITION 202606"
```
The frozen files reside inside `/var/lib/clickhouse/shadow/` and can be compressed and moved to AWS S3.
