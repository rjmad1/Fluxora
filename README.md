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
- 📄 [.cursorrules](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/.cursorrules) — AI-agent instructions to enforce the governance model.
- 📄 [copy_skills.py](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/copy_skills.py) — Skills.sh global package manager tool.
