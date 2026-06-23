# Operations & Maintenance Guide: Platform Scaling & Observability

This operations guide defines system scaling thresholds, monitoring metrics, and database backup routines for production clusters.

---

## 💾 System Backup Routines

To prevent data loss, schedule backups for the following storage layers:

### 1. PostgreSQL Database (Transactional Metadata)
Run weekly database dumps:
```bash
pg_dump -h <db_host> -U postgres -d fluxora_db -F c -b -v -f /backups/postgres/fluxora_db_$(date +%F).dump
```

### 2. ClickHouse Database (Telemetry Logs)
ClickHouse supports table partitions and native backups:
```sql
-- Run SQL freeze command to create points in ClickHouse filesystem
ALTER TABLE events_telemetry FREEZE;
```
Copy freeze snapshots from `/var/lib/clickhouse/shadow/` to safe offline storage.

### 3. HashiCorp Vault Secrets
If using the Raft integrated storage engine, create snapshots:
```bash
vault operator raft snapshot save /backups/vault/vault_snapshot_$(date +%F).snap
```

---

## 📈 System Scaling Boundaries

Verify the following network parameters when scaling the system to manage high campaign volumes:

| Component | Target Parameter | Threshold / Setting | Limit / Operational Rule |
| :--- | :--- | :--- | :--- |
| **Kafka** | `num.partitions` | `3` partitions per telemetry topic | Enables consumer load-balancing. |
| **Kafka** | `log.retention.hours` | `168` hours (7 days) | Discards old metrics automatically. |
| **ClickHouse** | Ingest Batch Size | `10,000` rows or every `5` seconds | Optimizes file merge cycles. |
| **Prisma** | Connection Pool | `connection_limit = 20` | Prevents PostgreSQL exhaustion. |

---

## 🔍 Observability and Metrics Checks

The platform is instrumented with **OpenTelemetry**. In production environments, check the Prometheus and Grafana dashboards for the following key indicators:

1. **API Ingress Latency:** Verify Kong Gateway proxy times remain $\le 500$ms.
2. **Telemetry Ingestion Lag:** Monitor Kafka consumer group lag for ClickHouse batch writers. If consumer lag increases, scale up the `telemetry-consumer` NestJS service replicas.
3. **Temporal Workflow Backlog:** Check pending workflow states. Slow workflow executions indicate that workers need more CPU capacity.
4. **Vault Client Errors:** Track 5xx responses on the backend Vault service. Unsealed Vault states require prompt operator manual unsealing.
