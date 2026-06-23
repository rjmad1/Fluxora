# System Configuration Reference

This reference details the environment variables and configuration properties used across the backend NestJS service and the frontend Next.js application.

---

## 📋 Configuration Key Directory

| Variable Name | Default Value | Description | Impact of Misconfiguration |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection URL. | App crashes; database unreachable. |
| `REDIS_HOST` | `localhost` | Redis host address for BullMQ. | Queue and caching errors. |
| `REDIS_PORT` | `6379` | Redis port mapping. | Connection timeout. |
| `VAULT_URL` | `http://localhost:8200` | HashiCorp Vault server url. | Falls back to database token encryption. |
| `VAULT_TOKEN` | `fluxora-dev-token` | Vault root/access token. | Authentication errors when writing secrets. |
| `ENCRYPTION_KEY` | `57652...` | 32-byte hex fallback key. | Decryption failures if DB fallback is active. |
| `KEYCLOAK_SERVER_URL` | `http://...:8081/auth` | Keycloak OpenID URL. | User login and auth tokens fail. |
| `KEYCLOAK_REALM` | `fluxora` | Keycloak Realm identifier. | JWT tokens rejected. |
| `KEYCLOAK_CLIENT_ID` | `backend` | API gateway client id. | Authentication failures. |
| `KEYCLOAK_CLIENT_SECRET`| `secret` | Client credential secret. | Handshake errors with Keycloak. |
| `PORT` | `3000` | Port NestJS API listens on. | Network reachability errors. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000`| Frontend API endpoint. | Frontend fails to fetch backend data. |
| `KAFKA_BROKERS` | `localhost:9092` | Broker address list. | Telemetry event logs fail to stream. |
| `KAFKA_FALLBACK` | `true` | Offline file logging toggle. | Bypasses Kafka. Telemetry logged to local logs. |
| `CLICKHOUSE_URL` | `http://localhost:8123`| ClickHouse REST endpoint. | Analytical performance dashboard fails. |
| `S3_BUCKET` | `fluxora-assets` | Asset storage bucket. | Media uploading fails. |
| `S3_ENDPOINT` | `http://localhost:9000`| MinIO/S3 connection host. | CDN or files unreachable. |
| `S3_ACCESS_KEY` | `minio-admin` | Storage Access Key. | Authorization failure. |
| `S3_SECRET_KEY` | `minio-admin-secret` | Storage Secret Key. | Authorization failure. |
| `TEMPORAL_ADDRESS` | `localhost:7233` | Workflows scheduler host. | Campaigns scheduling loop stops. |
| `OPENAI_API_KEY` | `""` | OpenAI platform key. | AI copy assistant features disabled. |
| `GEMINI_API_KEY` | `""` | Gemini platform key. | AI operations fail. |
| `QDRANT_URL` | `http://localhost:6333`| Vector Database host. | Brand compliance matching disabled. |

---

## 🔒 Secret vs Non-Secret Variables

* **Non-Secrets (Safe for git repository):** `PORT`, `KEYCLOAK_REALM`, `S3_REGION`, `S3_FORCE_PATH_STYLE`, `KAFKA_FALLBACK`.
* **Secrets (MUST NOT be committed to git):** `DATABASE_URL`, `VAULT_TOKEN`, `KEYCLOAK_CLIENT_SECRET`, `S3_SECRET_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `LINKEDIN_CLIENT_SECRET`. Standardize these via local `.env` files or mount them dynamically using HashiCorp Vault.
