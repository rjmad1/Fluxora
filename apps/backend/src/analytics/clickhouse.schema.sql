-- ClickHouse Telemetry Database Schema

-- Telemetry events table to record all publishing and user interaction events
CREATE TABLE IF NOT EXISTS telemetry_events (
    event_id String,
    event_type String,          -- 'post.publishing', 'post.dispatched', 'post.click', 'post.impression'
    tenant_id String,
    workspace_id String,
    post_id String,
    variant_id String,
    platform String,            -- 'linkedin', 'twitter', 'facebook'
    timestamp DateTime
) ENGINE = MergeTree()
ORDER BY (tenant_id, workspace_id, platform, timestamp);

-- Materialized View or helper queries can aggregate metrics in real-time
