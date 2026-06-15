# Data Model: Enterprise Observability & Scaling

This document defines the schemas and structures for telemetry data stored in ClickHouse.

## Telemetry Events Table (ClickHouse)

ClickHouse stores time-series telemetry events in a columnar format optimized for fast aggregation.

### Table Schema Definition

```sql
CREATE TABLE IF NOT EXISTS telemetry_events (
    id UUID,
    workspaceId String,
    postId String,
    platform String,
    eventType String,
    timestamp DateTime64(3, 'UTC')
) ENGINE = MergeTree()
ORDER BY (workspaceId, eventType, timestamp);
```

### Table Fields Description

| Field Name | ClickHouse Type | Description |
|:---|:---|:---|
| `id` | `UUID` | Unique identifier for the telemetry event. |
| `workspaceId` | `String` | Scopes the event to a specific workspace (tenancy boundary). |
| `postId` | `String` | Reference to the associated Post. |
| `platform` | `String` | Social media platform name (e.g., `linkedin`, `twitter`, `facebook`). |
| `eventType` | `String` | The type of lifecycle event (e.g., `post.publishing`, `post.dispatched`, `post.click`). |
| `timestamp` | `DateTime64(3, 'UTC')` | Millisecond-precision UTC timestamp of when the event occurred. |

### Indexing and Partitioning

- **Order By**: Sorted by `(workspaceId, eventType, timestamp)`. Since the analytics dashboard queries always filter by `workspaceId` and aggregate by `eventType`/`platform` over a time range, this sort key ensures ClickHouse queries read minimal data blocks.
- **Engine**: `MergeTree` is the standard engine for high-performance time-series data storage and query execution in ClickHouse.
