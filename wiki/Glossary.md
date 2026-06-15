# Glossary & FAQ

This page compiles definitions, platform acronyms, and responses to frequently asked questions.

---

## 📖 Terminology & Acronyms

* **Tenant**: The highest billing and access boundary, typically representing a parent agency or enterprise company.
* **Workspace**: An isolated space within a Tenant representing a single client brand or regional office. Workspaces are isolated via row-level security (RLS).
* **ConnectedAccount**: A connected social profile containing metadata in PostgreSQL and OAuth token keys stored in Vault.
* **Temporal**: An open-source durable execution system used to manage post-scheduling timers, retry workflows, and token refresh loops.
* **ClickHouse**: A column-oriented database management system optimized for high-speed OLAP analytics queries.
* **Keycloak**: An open-source identity and access management (IAM) server implementing OAuth2/OIDC protocols.
* **Outbox Pattern**: A design pattern where data-modifying queries write events to an `AuditOutbox` table within the same transaction block, which are then processed by a background worker and emitted to Kafka.

---

## ❓ Frequently Asked Questions

### 1. Where are my social OAuth tokens stored?
To protect client credentials, access and refresh tokens are stored in **HashiCorp Vault**. The PostgreSQL metadata database only contains a Vault reference pointer (`vaultSecretId`).

### 2. What happens if ClickHouse goes offline?
The NestJS analytics module falls back to a local file sandbox logger (`apps/backend/logs/clickhouse-sandbox/`). Performance dashboards will load static fallback metrics, and data is synced back to ClickHouse when it returns online.

### 3. How does custom domain white-labeling work?
When a client requests `/approval/[token]` using an agency domain (e.g. `portal.awesomeagency.com`), the API intercepts the request host, matches it to a database workspace, and enforces PostgreSQL RLS policies for that workspace.
