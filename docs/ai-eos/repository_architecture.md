# AI-EOS Repository Architecture (Repository Operating System)

This document defines the purpose, governance, structure, and constraints for each of the core directories in the AI Engineering Operating System (AI-EOS). Every folder is designed to be agent-navigable and self-describing.

---

## 1. Directory Structure Blueprint

| Directory | Purpose | Primary Owner | Lifecycle State | Validation Check |
| :--- | :--- | :--- | :--- | :--- |
| **`/specs`** | Feature specs & requirement models | Product Agent / PM | Approved $\rightarrow$ Implemented | SpecKit CLI check |
| **`/knowledge`** | Core organizational & domain knowledge base | Knowledge Architect | Active $\rightarrow$ Pruned | Markdown-lint & Link verification |
| **`/docs`** | End-user & general engineering docs | Tech Writer / Doc Agent | Active $\rightarrow$ Deprecated | Dead-link checkers |
| **`/architecture`**| System component & layout designs | Architect Agent | Active $\rightarrow$ ADR linked | Graphviz / Mermaid validity |
| **`/contracts`** | API, Event, and DB schemas | Backend Agent / Architect | Versioned | JSONSchema / OpenAPI validator |
| **`/adrs`** | Architectural Decision Records | Architect Agent | Permanent | ADR-log sequence checker |
| **`/runbooks`** | Operational manuals & recovery scripts | SRE Agent | Active $\rightarrow$ Retired | CLI syntax check |
| **`/agents`** | Agent definitions & local manifests | Platform Lead | Code-controlled | JSON Schema validation |
| **`/orchestration`**| Coordination code, graphs, and workflows | Platform Lead | Code-controlled | Static graph analysis |
| **`/memory`** | Local context cache & memory layers | Agent Orchestrator | Ephemeral / Permanent | Pruning rules validator |
| **`/prompts`** | System & specialist prompt templates | Prompt Engineer / Agent | Versioned | Prompt Linting |
| **`/evals`** | Test cases & benchmarks for AI outputs | Evaluation Agent | Versioned | Evals framework execution |
| **`/tests`** | Unit, Integration, E2E, Chaos tests | QA Agent / Lead | Versioned | Coverage & Execution Gates |
| **`/ci`** | GitHub Actions & CI/CD workflow code | DevSecOps Lead | Operational | Action-lint / YAML check |
| **`/platform`** | Developer portals, Golden Path setups | Platform Lead | Code-controlled | CLI scaffolding checks |
| **`/security`** | Threat models, secrets, and auth policies | Security Agent | Strict Governance | Policy validator (OPA) |
| **`/observability`**| Dashboards, SLIs/SLOs, and alert rules | SRE Agent | Operational | Alert rule schema verify |
| **`/data-governance`**| Linage catalogs, PII & classification | Data Architect | Versioned | Schema tagging check |
| **`/infra`** | Terraform, Docker, K8s configs | Infrastructure Agent | Active $\rightarrow$ Retired | TFLint / Kubeval |
| **`/scripts`** | Developer automation & auxiliary tasks | Platform Lead | Active | Shellcheck / PEP8 |

---

## 2. Comprehensive Folder Definitions

### 2.1 `/specs` (Specification Governance Layer)
- **Purpose**: Houses GitHub SpecKit specifications. The absolute source of truth for features.
- **Ownership**: Product Agent / Human Product Manager.
- **Lifecycle**: Draft $\rightarrow$ Under Review $\rightarrow$ Approved $\rightarrow$ Implemented $\rightarrow$ Retired.
- **Review Process**: Requires Architect and QA approval. SpecKit automated checks must pass.
- **Versioning Rules**: Incremental IDs (e.g., `001-spec.md`). File modifications must increment the spec version in metadata.
- **Validation Requirements**: Frontmatter schema completeness, verified Markdown format, and trace link to at least one Business Goal.
- **Discoverability**: Automatically parsed by the Product Agent to generate task checklists.

### 2.2 `/knowledge` (Open Knowledge Format)
- **Purpose**: Shared knowledge domain markdown files containing context logs, glossaries, and incident results.
- **Ownership**: Knowledge Systems Architect.
- **Lifecycle**: Continuous update. Deprecated files are moved to `archive/` subfolder.
- **Review Process**: PR peer review. Automated check verifies all cross-references compile.
- **Versioning Rules**: Commit history serves as the audit log. Semantic metadata contains `last_updated_date`.
- **Validation Requirements**: Must parse as valid OKF metadata (JSON frontmatter). No dead internal links.
- **Discoverability**: Indexed into the Vector DB for semantic agent retrieval (RAG).

### 2.3 `/docs` (General Documentation)
- **Purpose**: System setup guides, developer portals documentation, and project overviews.
- **Ownership**: Documentation Agent.
- **Lifecycle**: Updated alongside source code changes.
- **Review Process**: Reviewed by Engineering Lead.
- **Versioning Rules**: Tracked in git.
- **Validation Requirements**: All code snippets must run successfully (doc-tested).
- **Discoverability**: Maintained in the main developer documentation portal (`/docs/README.md`).

### 2.4 `/architecture` (System & Interface Diagrams)
- **Purpose**: System-wide block diagrams, component graphs, sequence diagrams, and interaction matrices.
- **Ownership**: Architect Agent / Chief Architect.
- **Lifecycle**: Evolved with ADRs.
- **Review Process**: Peer review by Architecture Board.
- **Versioning Rules**: Minor/Major versions matching the system boundaries.
- **Validation Requirements**: All diagrams must compile without errors using Mermaid or Graphviz parsers.
- **Discoverability**: Linked directly from specs and `/adrs`.

### 2.5 `/contracts` (API & Event Interfaces)
- **Purpose**: Strict interface contracts (OpenAPI, AsyncAPI, GraphQL schemas, Proto files).
- **Ownership**: Backend Agent.
- **Lifecycle**: Draft $\rightarrow$ Active $\rightarrow$ Deprecated $\rightarrow$ Broken (Removal).
- **Review Process**: Automatic contract-breaking checker. Human approval required for breaking changes.
- **Versioning Rules**: Mandatory SemVer in schemas.
- **Validation Requirements**: Linters (spectral for OpenAPI, buf for Protobuf).
- **Discoverability**: Centralized registry schema index.

### 2.6 `/adrs` (Architectural Decisions)
- **Purpose**: Architectural Decision Records documenting core changes to patterns, databases, and dependencies.
- **Ownership**: Architect Agent.
- **Lifecycle**: Proposed $\rightarrow$ Accepted $\rightarrow$ Superseded.
- **Review Process**: Standard RFC review; human board ratification.
- **Versioning Rules**: Sequential numbers (e.g., `ADR-004.md`).
- **Validation Requirements**: Must follow standard MADR template. Must reference spec/contract if relevant.
- **Discoverability**: Listed in `adrs/README.md` catalog.

### 2.7 `/runbooks` (Operational Guides)
- **Purpose**: Step-by-step procedures for handling alerts, disasters, and manual procedures.
- **Ownership**: SRE Agent.
- **Lifecycle**: Active $\rightarrow$ Verified $\rightarrow$ Archived.
- **Review Process**: Must be tested in a staging or dry-run environment.
- **Versioning Rules**: Versioned to match the component version.
- **Validation Requirements**: Links to matching Alerts in `/observability`.
- **Discoverability**: Mapped directly from alert names in logs/traces.

### 2.8 `/agents` (Agent Definitions & Roles)
- **Purpose**: Manifest configurations, system prompts, role classifications, and capabilities for active agents.
- **Ownership**: Platform Lead / AgentOps Lead.
- **Lifecycle**: Config-controlled.
- **Review Process**: Validation tests run on prompt edits.
- **Versioning Rules**: Major/Minor/Patch tracking agent behavior.
- **Validation Requirements**: Agent manifest matches standard agent schema.
- **Discoverability**: System-wide Agent Registry (`/agents/registry.json`).

### 2.9 `/orchestration` (Coordination Engine)
- **Purpose**: Codes governing agent state transitions, routing graphs, and communication protocols (e.g., LangGraph configs).
- **Ownership**: Platform Lead.
- **Lifecycle**: Versioned in sync with orchestration engine.
- **Review Process**: Run orchestration unit tests.
- **Versioning Rules**: Hard SemVer dependency.
- **Validation Requirements**: DAG cycle checks.
- **Discoverability**: Visualized in orchestration portal.

### 2.10 `/memory` (Agent Context)
- **Purpose**: Local file database containing semantic, procedural, and execution memory segments.
- **Ownership**: Agent Orchestrator.
- **Lifecycle**: Ephemeral or permanent based on tier.
- **Review Process**: Pruning algorithms run on schedule.
- **Versioning Rules**: N/A (runtime data).
- **Validation Requirements**: Size limits, data privacy validation (no PII in memory).
- **Discoverability**: Accessible via memory gateway.

### 2.11 `/prompts` (System Prompts)
- **Purpose**: Prompts registry containing role instructions, few-shot examples, and chain-of-thought steps.
- **Ownership**: Prompt Engineer / Specialist Agents.
- **Lifecycle**: Version-controlled.
- **Review Process**: Evaluated in Evals pipeline before production release.
- **Versioning Rules**: Prompts must be tagged with commit SHA.
- **Validation Requirements**: Prompt-linting syntax rules.
- **Discoverability**: Registered in `/prompts/index.json`.

### 2.12 `/evals` (Evaluation Suites)
- **Purpose**: Datasets and test cases to run against prompt outputs to measure accuracy, bias, and drift.
- **Ownership**: Evaluation Agent.
- **Lifecycle**: Continuous extension.
- **Review Process**: Reviewed on prompt modification.
- **Versioning Rules**: Matches prompt version.
- **Validation Requirements**: Valid JSON/YAML test cases.
- **Discoverability**: Integrated into CI pipeline.

### 2.13 `/tests` (Automated Tests)
- **Purpose**: Unit, integration, E2E, load, and security test files.
- **Ownership**: QA Agent.
- **Lifecycle**: Active matching code versions.
- **Review Process**: Required code coverage checks.
- **Versioning Rules**: Git branch/release tagged.
- **Validation Requirements**: 100% test execution in CI.
- **Discoverability**: Automated test discovery runner.

### 2.14 `/ci` (CI/CD Workflows)
- **Purpose**: CI/CD pipeline definitions (GitHub Actions, GitLab CI).
- **Ownership**: DevSecOps Lead.
- **Lifecycle**: Modified on pipeline changes.
- **Review Process**: Secure review from DevSecOps team.
- **Versioning Rules**: Match execution platforms.
- **Validation Requirements**: Action-lint checks.
- **Discoverability**: Triggered automatically on PR.

### 2.15 `/platform` (Platform Engineering Portal)
- **Purpose**: Scaffolding templates, project bootstrap files, CLI tools, and Golden Path configs.
- **Ownership**: Platform Lead.
- **Lifecycle**: Maintained for organizational bootstrapping.
- **Review Process**: Architecture approval.
- **Versioning Rules**: SemVer.
- **Validation Requirements**: Template compile tests.
- **Discoverability**: Developer portal integration.

### 2.16 `/security` (Threat Models & Security Policies)
- **Purpose**: Threat modeling files, OPA rules, IAM roles, secrets access policies, and AI safety criteria.
- **Ownership**: Security Agent / DevSecOps Lead.
- **Lifecycle**: Strict version control. No unapproved edits allowed.
- **Review Process**: Mandatory Security Architect sign-off.
- **Versioning Rules**: System versioned.
- **Validation Requirements**: Policies must pass compile checks.
- **Discoverability**: Scanned dynamically during local builds.

### 2.17 `/observability` (Alerting & Metrics Definitions)
- **Purpose**: OpenTelemetry metrics layouts, SLO configurations, alerting thresholds, and dashboard JSON files.
- **Ownership**: SRE Agent.
- **Lifecycle**: Operational.
- **Review Process**: Tested in staging.
- **Versioning Rules**: SemVer.
- **Validation Requirements**: AlertManager rules validation.
- **Discoverability**: Dashboard engine index.

### 2.18 `/data-governance` (Data Classification & Lineage)
- **Purpose**: Master metadata catalogs, lineage rules, and compliance logs.
- **Ownership**: Data Architect.
- **Lifecycle**: Updated when schemas alter.
- **Review Process**: Reviewed by Compliance lead.
- **Versioning Rules**: Data model versions.
- **Validation Requirements**: Lineage graphs must be cycle-free.
- **Discoverability**: Searchable catalog index.

### 2.19 `/infra` (Infrastructure as Code)
- **Purpose**: Terraform configs, Pulumi, Kubernetes manifests, Helm charts.
- **Ownership**: Infrastructure Agent.
- **Lifecycle**: Active matching target environment lifecycle.
- **Review Process**: Static code analysis (tfsec) + manual approval.
- **Versioning Rules**: Matches target environment tags.
- **Validation Requirements**: Terraform validate, plan verification.
- **Discoverability**: Registered in IaC registry.

### 2.20 `/scripts` (Operational Automation)
- **Purpose**: Local scripts, CI helpers, clean-up tools.
- **Ownership**: Platform Lead.
- **Lifecycle**: Pruned periodically.
- **Review Process**: Peer review.
- **Versioning Rules**: Git-tracked.
- **Validation Requirements**: Static analysis (Shellcheck, black).
- **Discoverability**: Documented in `scripts/README.md`.
