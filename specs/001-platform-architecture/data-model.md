# Data Models and Relational Boundaries

This document defines the schema models (Prisma schema layout) and row-level security boundaries for Fluxora.

---

## 1. Transactional Database Models (PostgreSQL / Prisma)

### Tenant
*Highest administration and billing boundary.*
* Fields:
  * `id`: `String` (UUIDv4, Primary Key)
  * `name`: `String`
  * `dataRegion`: `String` (Default: "US")
  * `createdAt`: `DateTime` (Default: `now()`)
* Relationships:
  * `workspaces`: `Workspace[]`

### Workspace
*Isolated tenant environment corresponding to client brands.*
* Fields:
  * `id`: `String` (UUIDv4, Primary Key)
  * `tenantId`: `String` (Foreign Key, references Tenant)
  * `name`: `String`
  * `createdAt`: `DateTime` (Default: `now()`)
* Relationships:
  * `tenant`: `Tenant`
  * `accounts`: `ConnectedAccount[]`
  * `posts`: `Post[]`
  * `assets`: `Asset[]`

### ConnectedAccount
*Social network connectivity tokens metadata. Sensitive keys stored in Vault.*
* Fields:
  * `id`: `String` (UUIDv4, Primary Key)
  * `workspaceId`: `String` (Foreign Key, references Workspace)
  * `provider`: `String` (e.g. "linkedin", "facebook")
  * `name`: `String`
  * `avatarUrl`: `String?`
  * `vaultSecretId`: `String` (Pointer reference to Vault credentials key)
  * `status`: `String` (Default: "ACTIVE")
  * `createdAt`: `DateTime` (Default: `now()`)
* Validation:
  * `provider` must be within approved platforms ("linkedin", "facebook", "twitter", "tiktok").
  * `vaultSecretId` must not be null or empty.

### Post
*Scheduled post content and variants.*
* Fields:
  * `id`: `String` (UUIDv4, Primary Key)
  * `workspaceId`: `String` (Foreign Key, references Workspace)
  * `content`: `String` (Unified base copy)
  * `scheduledAt`: `DateTime`
  * `status`: `String` (Draft, PendingApproval, Scheduled, Dispatched, Failed)
  * `createdAt`: `DateTime` (Default: `now()`)
* Relationships:
  * `variants`: `PostVariant[]`

### PostVariant
*Platform-specific copies and overrides.*
* Fields:
  * `id`: `String` (UUIDv4, Primary Key)
  * `postId`: `String` (Foreign Key, references Post)
  * `platform`: `String` (linkedin, facebook, twitter, tiktok)
  * `overrideContent`: `String?`
  * `assetUrls`: `String[]`

### Asset
*Media files in MinIO storage.*
* Fields:
  * `id`: `String` (UUIDv4, Primary Key)
  * `workspaceId`: `String` (Foreign Key, references Workspace)
  * `s3Key`: `String`
  * `filename`: `String`
  * `fileSize`: `Int`
  * `mimeType`: `String`
  * `tags`: `String[]`
  * `createdAt`: `DateTime` (Default: `now()`)

---

## 2. Row-Level Security (RLS) SQL Script
Every table must enforce access scoping using session parameters set by the Ingress API Gateway validation logic.

```sql
-- Enable Row-Level Security
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectedAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;

-- Workspace Isolation Policy
CREATE POLICY workspace_isolation_policy ON "Post"
  USING (workspace_id = current_setting('app.current_workspace_id'));
```

---

## 3. Columnar Database Event Schema (ClickHouse)

### TelemetryEvent
*High-throughput engagement events streaming from Kafka.*
* Fields:
  * `eventId`: `UUID`
  * `eventName`: `String`
  * `timestamp`: `DateTime64`
  * `tenantId`: `UUID`
  * `workspaceId`: `UUID`
  * `postId`: `UUID`
  * `platform`: `LowCardinality(String)`
  * `engagementMetric`: `String` (click, view, share, comment)
  * `metricValue`: `Int32`
* ClickHouse Engine: `MergeTree()` partitioned by `toYYYYMM(timestamp)` ordered by `(workspaceId, platform, timestamp)`.
