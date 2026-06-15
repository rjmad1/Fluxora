# Welcome to the Fluxora Wiki

Fluxora is an enterprise-grade multi-tenant social media scheduling, optimization, and distribution platform. The architecture is built around scale, reliability, and strict resource isolation, transforming standard social media managers into highly efficient, compliance-validated brand orchestrators.

---

## 🗺️ Wiki Navigation

Use the links below to navigate through the official documentation.

### 📘 Product & User Guides
* **[Product Guide](Product-Guide)** — Core strategy, differentiators, and target personas.
* **[User Guide](User-Guide)** — Guide for Marketing Mary and Agency Admins on campaign setups.
* **[FAQ & Glossary](Glossary)** — Frequently asked questions and terminology.

### 📐 Architecture & Development
* **[Architecture Overview](Architecture-Overview)** — Domain boundaries, system context, and component catalog.
* **[Data Model Guide](Data-Model-Guide)** — PostgreSQL (Prisma) and ClickHouse analytics schemas, including RLS policies.
* **[Developer & API Guide](Developer-and-API-Guide)** — Codebase structure, local setups, and API endpoints.
* **[AI Agent Guide](AI-Agent-Guide)** — LangGraph orchestration, brand compliance memory, and LLM routers.

### ⚙️ Operations & Deployment
* **[Administrator Guide](Administrator-Guide)** — Workspace provisioning, tenant limits, and custom domains.
* **[Operations Guide (Runbook)](Operations-Guide)** — Kafka monitoring, ClickHouse batch flushes, backup & restore procedures.
* **[Troubleshooting Guide](Troubleshooting-Guide)** — Dynamic resolution maps for social disconnection, credential locks, and rate limits.
* **[Security Guide](Security-Guide)** — RLS execution details, Vault transit operations, Keycloak RBAC mappings.
* **[Decision Records Index](Decision-Records-Index)** — Index of all architectural design records (ADRs).

---

## 🚀 Architectural Directive: Adopt → Extend → Wrap → Fork → Build

At Fluxora, our core architectural directive is:
> **"What capabilities should we buy, adopt, or compose so engineering only builds proprietary differentiation?"**

We follow a strict priority model for adding or implementing any capabilities:
1. **Adopt**: Use existing open-source software (OSS) or SaaS APIs directly (e.g., Keycloak, Kafka, ClickHouse, Temporal).
2. **Extend**: Add plugins or scripts to existing solutions.
3. **Wrap**: Wrap components behind custom API facades.
4. **Fork**: Fork when changes are necessary and cannot be achieved by extension/wrapping.
5. **Build**: Build from scratch **ONLY** when it is a proprietary, strategic differentiator.

---

## 🏆 Proprietary Differentiators (We Only Build These)

Engineering effort is focused exclusively on:
1. **Distribution Intelligence Engine**: Anti-ban staggering, channel dispatch optimization, and smart retry schedules.
2. **Agency Operating System**: Multi-workspace isolation, white-label client branding, and secure client approval portals.
3. **Content Adaptation Engine**: Platform-aware transformations, image/video resizing, and asset variations.
4. **AI Content Operations**: Brand-voice alignment, local compliance validations, and campaign automation rules.
5. **Analytics Intelligence Layer**: Multi-channel ROI attribution, workflow velocity measurements, and campaign effectiveness scoring.
6. **Multi-Tenant Governance Engine**: Strong isolation guarantees, policy validations, and enterprise compliance reporting.
