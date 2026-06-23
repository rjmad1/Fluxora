# Fluxora — Social Media Blast Ecosystem

Fluxora is an enterprise-grade multi-tenant social media scheduling, optimization, and distribution platform. The architecture is built around scale, reliability, and strict resource isolation.

---

## 🚀 Architectural Governance: Adopt → Extend → Wrap → Fork → Build

At Fluxora, our core architectural directive is:
> **"What capabilities should we buy, adopt, or compose so engineering only builds proprietary differentiation?"**

We follow a strict priority model for adding or implementing any capabilities:
1. **Adopt**: Use existing open-source software (OSS) or industry-standard SaaS APIs directly.
2. **Extend**: Add plugins, extensions, or scripts to existing solutions (e.g., Keycloak Extensions, Kong Plugins).
3. **Wrap**: Wrap existing components behind custom API facades or orchestration flows.
4. **Fork**: Fork open-source packages when modifications are necessary and cannot be achieved by extension/wrapping.
5. **Build**: Build from scratch **ONLY** when no viable alternative exists and the capability represents a proprietary, strategic differentiator.

All proposals for new components must fill out the **Component Proposal Template** found in our [Architecture Guidelines](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/docs/architecture_guidelines.md).

---

## 🛠️ System Stack at a Glance

| Domain | Technology / Adopted Service | Usage Details |
| :--- | :--- | :--- |
| **Identity** | Keycloak | OIDC, OAuth2, RBAC, SCIM |
| **API Gateway** | Kong Gateway / Traefik | JWT Validation, Rate Limiting, Tenant Enforcement |
| **Secrets** | HashiCorp Vault | OAuth Tokens, API Keys, Certificates |
| **Workflow** | Temporal | Publishing, Scheduling, Approvals, Transcoding workflows |
| **Event Mesh** | Apache Kafka | Telemetry, Audit Trails, AI Pipelines, Message Dispatch |
| **Databases** | PostgreSQL & ClickHouse | PostgreSQL (Transactional), ClickHouse (Analytics & Metrics) |
| **Search** | OpenSearch | Content search, Asset search, Audit logs |
| **Asset Storage**| MinIO & CloudFront | Object storage, CDN caching |
| **Observability**| OpenTelemetry | Unified logs, metrics, traces, events via Prometheus & Grafana |
| **Billing** | Stripe | Billing & subscription handling; custom Entitlement engine |
| **AI Layer** | OpenAI, Anthropic, Gemini | Orchestration via LangGraph & Temporal; custom LLM Router |
| **Vector Db** | Qdrant | Brand memory, content history, agent state storage |

---

## 🏆 Proprietary Differentiators (We Only Build These)

Engineering effort is strictly focused on building and optimizing the following proprietary systems:

1. **Distribution Intelligence Engine**: Responsible for anti-ban account staggering, channel dispatch optimization, and smart retry schedules.
2. **Agency Operating System**: Multi-workspace isolation, white-label client branding, and secure external client approval portals.
3. **Content Adaptation Engine**: Performs platform-aware transformations, automatic image/video resizing, character-limit formatting, and asset variations.
4. **AI Content Operations**: Brand-voice alignment, local compliance validations, and campaign automation rules.
5. **Analytics Intelligence Layer**: Multi-channel ROI attribution, workflow velocity measurements, and campaign effectiveness scoring.
6. **Multi-Tenant Governance Engine**: Strong isolation guarantees, policy validations, and enterprise compliance reporting.

---

## 📂 Project Structure

- 📁 [Functional Requirements](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/Functional%20Requirements) — Original XLSX and PDF business specs.
- 📁 [PM_Deliverables](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/PM_Deliverables) — Product requirement docs, backlogs, user personas, risk registers, and GTM strategy.
- 📁 [docs](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/docs)
  - 📄 [architecture_guidelines.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/docs/architecture_guidelines.md) — Comprehensive architecture principles and rules.
- 📁 [.specify](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/.specify) — Spec-Kit workflows, scripts, templates, and constitution.
- 📁 .cursor & .agents — IDE agent integrations and skills.
- 📄 [.cursorrules](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/.cursorrules) — AI-agent instructions enforcing the governance model.
- 📄 [copy_skills.py](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/copy_skills.py) — Skills.sh global package manager tool.

---

## 📝 Spec-Driven Development (SDD) with Spec-Kit

Fluxora incorporates the [GitHub Spec-Kit](https://github.com/github/spec-kit) to drive structured, repeatable, and verifiable development. By moving away from "vibe coding," we ensure that specifications remain the executable source of truth.

### Key Workflows and Commands

We utilize the `specify` CLI tool to scaffold features and manage integrations:

1. **Verify Setup**:
   ```bash
   specify check
   ```

2. **Core SDD Flow**:
   The workflow is split into five progressive phases. You can initiate them using the following agent slash commands:
   - `/speckit-constitution`: Reviews the governing rules in [constitution.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/.specify/memory/constitution.md) (aligned with Fluxora's architecture rules).
   - `/speckit-specify`: Generates or updates the feature specification under `specs/`.
   - `/speckit-plan`: Create technical implementation plans.
   - `/speckit-tasks`: Generate actionable checklists.
   - `/speckit-implement`: Run code implementation.

---

## 📚 Documentation Suite & Manuals

To support smooth developer onboarding, production maintenance, and release execution, refer to the following comprehensive documentation guides:

* [INSTALL.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/INSTALL.md) — Multi-environment installation guide.
* [QUICKSTART.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/QUICKSTART.md) — Developer onboarding & telemetry validation steps.
* [USER_GUIDE.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/USER_GUIDE.md) — Connect networks, compose, and schedule content.
* [ADMIN_GUIDE.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/ADMIN_GUIDE.md) — Keycloak client configurations, Vault paths, and tenant boundaries.
* [OPERATIONS_GUIDE.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/OPERATIONS_GUIDE.md) — Backups, system scaling limits, and metric checks.
* [TROUBLESHOOTING.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/TROUBLESHOOTING.md) — Resolving key integrations, docker port, and dependency conflicts.
* [RELEASE_PROCESS.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/RELEASE_PROCESS.md) — Release tagging rules, pipeline definitions, and rolling deployments.
* [CONTRIBUTING.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/CONTRIBUTING.md) — Linting instructions, format targets, and PR checks.
* [CONFIGURATION_REFERENCE.md](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/CONFIGURATION_REFERENCE.md) — Full env-variable index detailing all API configurations.

---

## 🎛️ Pinokio Browser Integration

Fluxora is compatible with the [Pinokio.com](https://pinokio.com) browser ecosystem. You can install, initialize, and control Fluxora programmatically through one-click commands inside the Pinokio browser using:

* `pinokio.js` — Launcher configuration UI.
* `install.js` — Auto clone, package installation, and database definitions setup.
* `start.js` — Orchestrate devflow and infrastructure containers.
* `stop.js` — Halt background containers.
* `update.js` — Sync remote commits and rebuild client models.
* `uninstall.js` — Wipe local volumes and reset directories.

3. **Enhancement Commands**:
   - `/speckit-clarify`: Pre-plan query session to de-risk ambiguous requirements.
   - `/speckit-checklist`: Generates a checklist to validate implementation quality.
   - `/speckit-analyze`: Runs a cross-artifact verification report.
