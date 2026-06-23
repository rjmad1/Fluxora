# Quickstart Developer Guide: Telemetry & Ingest Pipeline

This guide outlines how to bootstrap the Fluxora environment and verify that the Event-Driven Kafka telemetry and ClickHouse database ingestion pipeline are working.

---

## 🏎️ Running the Stack in 3 Steps

1. **Verify Environment Setup:**
   Confirm that Node.js 20+ and Docker Desktop are running.
   
2. **Launch Application & Services:**
   Run the devflow orchestrator at the root of the workspace:
   ```bash
   npm run devflow
   ```
   *This starts Postgres, Redis, Kafka, Keycloak, ClickHouse, and Vault containers, and spins up the backend and frontend dev servers.*

3. **Confirm Port Bindings:**
   - **Backend server:** http://localhost:3000
   - **Frontend UI:** http://localhost:3001

---

## 📊 Ingest Pipeline Verification

Fluxora streams omnichannel user events through Apache Kafka and persists them inside ClickHouse for low-latency analytics query aggregations. Follow these steps to verify:

### Step 1: Ingest Simulation
1. Open http://localhost:3001 in your browser.
2. Navigate to the **Analytics Dashboard** section.
3. Locate the **Event Ingestion Simulator** panel.
4. Select a platform (e.g. `LinkedIn`), select an event type (e.g. `Click`), and click **Simulate Event**.

### Step 2: Confirm Ingestion Stream
Upon clicking, the frontend dispatches a mock event payload to the analytics API endpoint (`POST http://localhost:3000/analytics/simulate`).
- **Telemetry pipeline sequence:** Analytics API -> Kafka Producer -> Topic: `fluxora.telemetry.events` -> Telemetry consumer -> ClickHouse Batch Writer -> Persisted ClickHouse.

### Step 3: Verify Real-Time Dashboard Updates
The dashboard performance graph refreshes dynamically. If ClickHouse or Kafka is offline:
- The system defaults to the local sandbox file fallback at `apps/backend/logs/clickhouse-sandbox/events.json`.
- Check if local sandbox file fallback writes are successful if Docker containers are paused.

---

## 🧪 Running Automated Tests

Verify that integrations and services pass tests:
```bash
npm run test:backend
```
*This executes Jest units checking the ClickHouse adapters and Kafka streaming fallback behaviors.*
