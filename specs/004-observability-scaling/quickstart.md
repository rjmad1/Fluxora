# Quickstart Validation Guide: Enterprise Observability & Scaling

This guide outlines how to verify that the Kafka and ClickHouse telemetry pipelines function correctly.

## Prerequisites

Ensure the backend and frontend are running. If you want to run with real ClickHouse, make sure the Docker container is healthy:
```bash
docker ps | grep clickhouse
```

If it is running, the app will automatically connect to it. Otherwise, it will seamlessly fall back to using the local JSON-file-based database sandbox at `apps/backend/logs/clickhouse-sandbox/events.json`.

## Automated Ingest Verification

To verify the integration, run the unit and integration tests:
```bash
npm run test --workspace=apps/backend
```

## Manual Verification Steps

1. **Open the Analytics Dashboard**
   Navigate to the main frontend landing page at `http://localhost:3000`. You will see the Analytics section.

2. **Simulate Engagement Events**
   Using the simulator panel on the dashboard:
   - Select a platform (e.g. `LinkedIn`).
   - Select event type (e.g. `Click`).
   - Click **Simulate Event**.

3. **Verify Dashboard Update**
   Confirm that the view/click count increments immediately, demonstrating that the simulated event has successfully traversed the telemetry pipeline (Kafka event emission -> ClickHouse ingestion -> Dashboard aggregation endpoint) in under 1.5 seconds.
