# Installation Manual: Fluxora Omnichannel Platform

This document describes supported platforms, pre-installation prerequisites, step-by-step setup workflows, and rollback procedures.

---

## 💻 Supported Platforms

* **Development Environments:** Windows 10/11 (with WS2/PowerShell 7+), macOS 12+ (Apple Silicon or Intel), Linux (Ubuntu 22.04 LTS or equivalent).
* **Container runtimes:** Docker Engine v24.0.0+, Docker Compose v2.20.0+, Kubernetes v1.26+.

---

## 🛠️ Prerequisites

Before launching the installation, verify that the following system tools are available:

1. **Node.js:** version `v20.x.x` or higher (verify via `node -v`).
2. **NPM:** version `v10.x.x` or higher (verify via `npm -v`).
3. **Docker Desktop:** installed and running with at least `4GB` allocated RAM (recommended for the full infrastructure stack).
4. **Git:** version `v2.40.0` or higher.

---

## 📦 Dependency Manifest Requirements

| Component | Port | Internal Engine / Image | Purpose |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `54321` | `postgres:16-alpine` | Transactional data metadata. |
| **Redis** | `6379` | `redis:7-alpine` | Micro-queue manager. |
| **Keycloak** | `8081` | `quay.io/keycloak:24.0` | Identity, OAuth, SSO Provider. |
| **Kong Ingress** | `8000` | `kong:3.6-alpine` | API Gateway, Header routing. |
| **Kafka** | `9092` | `apache/kafka:3.8.0` | Event stream pipeline. |
| **ClickHouse** | `8123` | `clickhouse/clickhouse-server:24` | Telemetry analytics store. |
| **HashiCorp Vault**| `8200` | `hashicorp/vault:1.17` | Secure OAuth token vaulting. |

---

## 🚀 Installation Workflows

### Option A: Local Host Development (Recommended for developers)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fluxora/fluxora.git
   cd fluxora
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Initialize environment settings:**
   Copy the example environment settings to the backend workspace folder:
   ```bash
   cp .env.example apps/backend/.env
   ```

4. **Verify database client bindings:**
   Run Prisma bindings generation to initialize database mappings:
   ```bash
   npx prisma generate --schema=apps/backend/prisma/schema.prisma
   ```

5. **Boot infrastructure and launch the applications:**
   Use the DevFlow CLI runner to spin up docker infrastructure and run frontend & backend in parallel:
   ```bash
   npm run devflow
   ```
   *The script will automatically detect port conflicts and run PostgreSQL, ClickHouse, Keycloak, Vault, Redis, and Kafka.*

---

### Option B: Unified Docker Compose Setup

To package and run the entire stack inside containers without node installed on the host machine:

1. **Launch unified docker-compose environment:**
   ```bash
   docker compose up -d --build
   ```

2. **Verify running containers:**
   ```bash
   docker compose ps
   ```
   *Applications will be reachable at http://localhost:3000 (Backend API) and http://localhost:3001 (Next.js Dashboard).*

---

### Option C: Installation via Pinokio

Fluxora has native Pinokio launcher workflows. Simply import the repository in Pinokio browser, and click **Install**. The browser executes `install.js`, downloading node modules and verifying Docker parameters automatically.

---

## 🔄 Upgrade Procedures

To perform system upgrades:

1. **Fetch upstream modifications:**
   ```bash
   git pull origin main
   ```
2. **Re-install dependencies and update database clients:**
   ```bash
   npm install
   npx prisma generate --schema=apps/backend/prisma/schema.prisma
   ```
3. **Execute database migrations:**
   ```bash
   npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
   ```

---

## ⏪ Rollback Procedures

If an upgrade fails, perform the following rollback steps:

1. **Revert code commits:**
   ```bash
   git reset --hard HEAD~1
   ```
2. **Restore previous database state (if backup was created):**
   ```bash
   pg_restore -d fluxora_db backup_file.dump
   ```
3. **Restart the processes:**
   ```bash
   npm run devflow
   ```
