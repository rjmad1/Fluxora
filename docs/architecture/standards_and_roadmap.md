# Fluxora Engineering Standards, Architectural Audit & Modernization Roadmap

**Document Version**: 1.0.0  
**Target Repository**: `rjmad1/Fluxora` (`c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast`)  
**Status**: Approved / Active  

---

## 1. Executive Summary

This document establishes the repository-wide engineering standards, architectural boundaries, code review policies, and modernization roadmap for **Fluxora**. 

Fluxora is transitioning from a traditional social publishing application to an autonomous, closed-loop **Growth Operating System (Growth OS)**. The core software platform leverages modern technologies including NestJS v11, Next.js v16, Tailwind CSS v4, PostgreSQL v16 (with RLS), Apache Kafka, and ClickHouse. While the database layers, stream processing, and multi-tenant primitives are technologically advanced, the application code suffers from significant **structural and design-level issues** that limit developer velocity, testability, and scalability.

This audit evaluates the codebase's current state, specifies the ideal target architecture, generates mandatory standards, and defines a prioritized remediation plan.

### Architecture Quality Scorecard

Based on a quantitative review of the codebase, the following scores reflect the current state (prior to remediation):

| Dimension | Score (0–10) | Justification |
| :--- | :---: | :--- |
| **Repository Structure** | **4 / 10** | A monorepo layout is established, but boundaries are weak. Frontend components are flat-listed without feature separation, and configuration layout lacks global centralization. |
| **Architecture** | **3 / 10** | Severe violations of architectural patterns. Features are clumped together into "God Service" and "God Controller" layers. Mixed concerns plague the UI, combining layout with 20+ tabs of routing and state. |
| **Maintainability** | **3 / 10** | High cognitive overhead. Modifying a feature in social listening or link shortening requires editing a 1,500-line service file and a 1,780-line UI component file. |
| **Readability** | **5 / 10** | Individual methods are relatively clear, but their consolidation into massive files obscures logical flows and prevents modular tracking. |
| **Scalability** | **6 / 10** | Telemetry pipelines (Kafka -> ClickHouse) are well-architected for data volume, but code organization prevents scaling the development team (multiple engineers editing the same file creates merge conflicts). |
| **Testability** | **3 / 10** | Unit testing is difficult. The God files contain tightly coupled dependencies and filesystem side effects that make mocking tedious and tests fragile. |
| **Security** | **7 / 10** | Tenant boundaries are structurally supported via interceptors and headers, but mock sandboxes skip validation checks, posing leak risks if extended to production. |
| **Developer Experience** | **4 / 10** | High onboarding friction. Finding where code lives is hard because features are scattered across ambiguous folders like `extended-features`. |

---

## 2. Best Practices Baseline

The baseline benchmark is modeled on industry-grade software engineering principles for enterprise SaaS, multi-tenant architectures, and distributed systems.

```
                  [Evaluation Baseline Benchmark]
 ┌───────────────────────┬──────────────────────┬──────────────────────┐
 ▼                       ▼                      ▼                      ▼
[SRP Modules]       [Isolated Domains]     [Strict Clean DB]     [Automated Gates]
- File size < 400L  - Backend: Domain-dir  - Decoupled SQL/HTTP  - Circular Checks
- Single purpose    - Frontend: Feature-dir- Repository Pattern  - coverage >= 80%
```

1. **Repository & Folder Structure**:
   - Clean separation between core packages, applications, infrastructure assets, and global configurations.
   - Core workspaces (e.g., `apps/*`, `packages/*`) must enforce build boundaries. No cross-app direct imports; all shared code must pass through versioned packages or explicit shared modules.
2. **Module Design (Single Responsibility Principle)**:
   - File sizes must not exceed 400 lines of code.
   - Modules must hide implementation details. They must expose interfaces via public entry points (`index.ts` or NestJS modules). Direct internal imports are strictly forbidden.
3. **Dependency Management**:
   - Dependency direction must be unidirectional: higher-level modules (business logic) must never depend on lower-level modules (database connections, framework activities) without using dependency inversion (interfaces).
4. **Testing Standards**:
   - Minimum unit test coverage of 80% on all business logic.
   - Core domain actions (e.g., publishing, identity resolution, budget orchestration) must undergo automated integration testing.
5. **Documentation**:
   - Any module must document its public API contract, data structures, and edge-case exceptions using inline TSDoc/JSDoc format.
6. **Security & Tenant Isolation**:
   - All database queries, stream consumers, and cache structures must be bounded by a context-injected `workspaceId` and `tenantId`.
   - Dynamic credential generation or storage must occur in a cryptographically secured Vault (e.g., HashiCorp Vault, AWS Secrets Manager), never hardcoded or committed to git.
7. **CI/CD & Observability**:
   - Code changes must pass linting, formatting, static analysis, unit tests, and structural validation (fitness functions) before merging.
   - System activities must emit standardized, level-structured telemetry (OpenTelemetry specs) featuring high-cardinality metadata (tenant ID, workspace ID, operation ID).

---

## 3. Current Repository Assessment

The current workspace `Fluxora_SocialMediaBlast` contains three main active zones: backend, frontend, and specification folders.

### NestJS Backend Assessment
The backend implements a standard NestJS application framework using Node.js v20+ and TypeScript v5.7. It is located at [package.json](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/package.json).

* **Strengths**: 
  - Tenant context is systematically extracted and applied using a NestJS interceptor [tenant.interceptor.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/tenant/tenant.interceptor.ts).
  - Outbox patterns are defined to enforce transactional integrity on event emissions [outbox.interceptor.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/observability/outbox.interceptor.ts).
  - Telemetry streaming matches the specification (Kafka and ClickHouse client integrations).
* **Weaknesses**:
  - **God Service**: The [extended-features.service.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/extended-features/extended-features.service.ts) file is **1,504 lines long**. It manages everything from Social Listening, Competitor tracking, A/B Testing, UTM link shortening, Community CRM Inbox, custom content taxonomies, to Media Studio transformation configurations.
  - **God Controller**: The [extended-features.controller.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/extended-features/extended-features.controller.ts) file is **304 lines long** and exposes 18+ different endpoints across completely unrelated functional domains under a single `api/v1/extended` routing prefix.
  - **Local Sandbox Coupling**: The mock database is a hardcoded JSON file [extended-features-sandbox.json](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/logs/extended-features-sandbox.json) which is read and written synchronously by `ExtendedFeaturesService` constructor and endpoints, creating blocking disk I/O operations.

### Next.js Frontend Assessment
The frontend implements a Next.js App Router application using Tailwind CSS v4 and React 19. It is located at [package.json](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/package.json).

* **Strengths**:
  - Leverages React 19 compiler patterns, Framer Motion transitions, and Tailwind CSS v4 variables for high visual fidelity.
  - Clean modular components exist, such as [ABTestingConsole.tsx](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/components/ABTestingConsole.tsx) and [SocialListening.tsx](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/components/SocialListening.tsx).
* **Weaknesses**:
  - **God Page Component**: The [page.tsx](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/app/page.tsx) file is **1,784 lines long**. It acts as the entire application workspace page. It contains the state variables for the entire UI, handles manual routes, manages sidebar toggle parameters, conducts inline fetch actions to backend APIs, and imports 35 flat React components.
  - **Flat Component Dumping**: All components are stored in a single flat directory [components/](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/components/). There is no grouping of related controls (e.g. all studio tools, all listening graphs, or all integrations setup). This leads to high cognitive load and name-spacing confusion.

---

## 4. Folder Structure Assessment

This section details the gaps between the current flat folder structure and our best-practice benchmark, providing a concrete migration strategy.

### Gap Analysis Matrix

| Folder Context | Current State | Best Practice | Risk / Consequence |
| :--- | :--- | :--- | :--- |
| **Backend Feature Modules** | Flat feature folders in `apps/backend/src/`. Unrelated features grouped under `extended-features/` as a single NestJS module. | **Domain-Bounded Feature Layout**: Separated sub-folders per business domain. | Inability to scale development. Merge conflicts on common controllers. Lack of encapsulation. High risk of cyclic dependencies. |
| **Frontend Components** | 35 components flat-listed in `apps/frontend/src/components/` with mixed feature ownership. | **Feature-Based Subdirectory Structure**: `/components/features/[domain]/` separating core layouts from business components. | Difficult to audit component boundaries. Ambiguous dependency graphs. Hard to isolate test suites. |
| **Frontend Page Layouts** | Single 85KB [page.tsx](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/app/page.tsx) rendering 20 tabs inline. | Next.js **App Router Parallel/Nested Routes** and subpage files (`/app/dashboard`, `/app/listening/page.tsx`). | Single point of failure. Slow client-side load time due to loading code for all 35 components on initial page load. |

### Migration Strategy

1. **Step 1: Code Isolation (Backend)**
   - Deconstruct [extended-features.service.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/extended-features/extended-features.service.ts) into domain services:
     * `listening.service.ts` (Social listening & trends)
     * `advocacy.service.ts` (Templates & employee advocacy)
     * `ab-testing.service.ts` (Experiment variants)
     * `links.service.ts` (UTM link shortening)
     * `compliance.service.ts` (Audit logs & safety check)
     * `inbox.service.ts` (CRM Inbox messaging)
     * `taxonomy.service.ts` (Tags & weights)
     * `media.service.ts` (Studio assets bulk update)
   - Expose them through standard sub-modules, which are then imported by the parent `ExtendedFeaturesModule` to preserve backwards compatibility.

2. **Step 2: Sub-Routing (Frontend)**
   - Split `page.tsx` tabs into Next.js directory folders:
     * `/app/dashboard/page.tsx`
     * `/app/listening/page.tsx`
     * `/app/studio/page.tsx`
     * `/app/personal-hub/page.tsx`
     * `/app/compliance/page.tsx`
     * `/app/links/page.tsx`
   - Turn `page.tsx` into a lightweight root dashboard router that performs immediate layout wrapping and client redirection.

---

## 5. Code Structure Assessment

Below are evidence-based code violations detected in the repository, along with risk evaluations and concrete refactoring solutions.

### NestJS Backend Code Violations

#### 1. Single Responsibility Principle Violation (God Service)
* **Symbol**: `ExtendedFeaturesService` ([extended-features.service.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/extended-features/extended-features.service.ts))
* **Evidence**: The class imports standard Node filesystem (`fs`), `crypto`, and manages 15 discrete interfaces including `BrandMention`, `Competitor`, `PostTemplate`, `LeaderboardEntry`, `ABTest`, `ShortenedLink`, `AuditLog`, `WorkspaceSettings`, `TrendingTopic`, `CompetitorPost`, `InboxMessage`, `TaxonomyTag`, `AutoCollection`, and `MediaStudioItem`.
* **Risk**: High coupling. Changes to the audit logging logic require modifying the class that orchestrates critical UTM URL creation. Test coverage is hard to configure as test fixtures must construct the mock values for all 15 domains simultaneously.
* **Refactoring Strategy**: Refactor the class by delegating operational methods to individual, focused service classes, using a facade pattern for legacy APIs.

#### 2. God Controller (Mixed Routing Concatenation)
* **Symbol**: `ExtendedFeaturesController` ([extended-features.controller.ts](file:///c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/extended-features/extended-features.controller.ts))
* **Evidence**: Employs `@Controller('api/v1/extended')` and aggregates `@Get('listening/mentions')`, `@Post('listening/keyword')`, `@Post('listening/ticket')`, `@Get('advocacy/templates')`, `@Post('ab-testing/create')`, `@Post('links/shorten')`, `@Get('compliance/logs')`, `@Post('inbox/reply')`, `@Post('taxonomy/tags')`, and `@Post('media/transform')`.
* **Risk**: Lack of granular rate-limiting and access control. Intercepting or securing specific paths (e.g. compliance logs require admin credentials while template sharing only requires agent access) is difficult when all routes pass through a single controller.
* **Refactoring Strategy**: Create dedicated controllers for each domain under their respective URL prefixes, e.g., `@Controller('api/v1/listening')` and `@Controller('api/v1/compliance')`.

---

## 6. Anti-Pattern Inventory

The following structural, repository, code, and testing anti-patterns are active inside the codebase:

### Architecture Anti-Patterns

#### A. God Service & God Controller (High Severity)
* **Evidence**: Found in `ExtendedFeaturesService` and `ExtendedFeaturesController`.
* **Impact**: Blocks team parallelization. Two developers working on A/B Testing and Compliance will face merge conflicts on the same controller and service files.
* **Correct Practice**: Refactor into domain services and domain controllers.

#### B. Infrastructure Leakage into Business Services (Medium Severity)
* **Evidence**: Direct calls to `fs.writeFileSync` and `fs.readFileSync` for JSON database management inside `ExtendedFeaturesService` constructor and helper methods:
  ```typescript
  // c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/backend/src/extended-features/extended-features.service.ts
  private saveData() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }
  ```
* **Impact**: Database lockouts and slow synchronous disk I/O blocking the Node.js event loop.
* **Correct Practice**: Extract data management behind a Repository Interface (Repository Pattern) and use async operations.

#### C. Shared Kernel Abuse / Implicit Dependencies (Low Severity)
* **Evidence**: Multi-tenant state logic is implicitly managed by passing `workspaceId` as a raw string parameter on every method call, instead of retrieving it securely from an execution context scope.
* **Impact**: Missing security parameters could result in cross-tenant data leaks.
* **Correct Practice**: Bind the active workspace ID to the request execution context and apply scoped query decorators.

---

### Repository Anti-Patterns

#### A. Utility Folder Syndrome / Flat Dump (Medium Severity)
* **Evidence**: Flat collection of 35 files inside `apps/frontend/src/components/`.
* **Impact**: Hard to trace what components are used where. Deleting unused features becomes risky.
* **Correct Practice**: Reorganize into feature subfolders: `components/listening`, `components/advocacy`, `components/shared/ui`.

#### B. Configuration Sprawl (Medium Severity)
* **Evidence**: Config values (e.g. Keycloak endpoints, DB parameters, local sandbox paths) are duplicated between environment variables and defaults across controllers.
* **Impact**: High risk of config drift between staging and production.
* **Correct Practice**: Standardize on a centralized NestJS `ConfigService` mapping validation schemas.

---

### Code Anti-Patterns

#### A. Primitive Obsession (Medium Severity)
* **Evidence**: Using raw strings for platform identifiers (e.g., `"linkedin" | "twitter" | "facebook"`) and event types throughout both the frontend simulator and backend services.
* **Impact**: Prone to typos (e.g., `"twitter"` vs `"twitter / x"`).
* **Correct Practice**: Define a strict TypeScript union type or Enum:
  ```typescript
  export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook';
  ```

#### B. Large Switch/Conditionals block in Page Component (High Severity)
* **Evidence**: In `apps/frontend/src/app/page.tsx`, the tab routing is managed via manual conditional rendering in a massive JSX tree:
  ```tsx
  // c:/Users/rajaj/Projects/Fluxora_SocialMediaBlast/apps/frontend/src/app/page.tsx
  {activeTab === "dashboard" && ( ... )}
  {activeTab === "personal-hub" && ( ... )}
  {activeTab === "calendar" && ( ... )}
  {activeTab === "agent" && ( ... )}
  {activeTab === "studio" && ( ... )}
  ```
* **Impact**: The entire client bundle size includes every tab and every sub-component layout, regardless of what tab the user is visiting.
* **Correct Practice**: Transition to Next.js Page-based layout files.

---

### Testing Anti-Patterns

#### A. Missing Domain Validation Tests (High Severity)
* **Evidence**: Backend test coverage focuses on root endpoints. There are no tests verifying that `ExtendedFeaturesService` handles concurrent file writes or separates data between `ws-1` and `ws-2` without leaking.
* **Impact**: Fragile updates. Small refactorings could break multi-tenant separation.
* **Correct Practice**: Add scoped unit tests for tenant data boundaries.

#### B. Frontend Integration Gaps (Medium Severity)
* **Evidence**: Frontend components rely on local fallback simulations when endpoints return a connection warning. These fallback paths are not verified in Playwright tests.
* **Impact**: App shell looks operational, but APIs might fail silently behind the UI.
* **Correct Practice**: Configure Playwright mocks to verify both success states and api failure states.

---

## 7. Technical Debt Register

Below is the prioritized technical debt registry for the current codebase:

```
[TECHNICAL DEBT HEATMAP]
High Impact / High Effort   | High Impact / Low Effort
- Next.js Page Split        | - Deconstruct ExtendedFeaturesService
- Sync I/O File Extraction  | - Primitive Obsession Refactoring
                            |
Low Impact / High Effort    | Low Impact / Low Effort
- Folder restructuring      | - Centralized Env configuration
```

| ID | Component | Description | Severity | Impact | Effort | Priority |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **TD-01** | Backend: Extended Features | God Service (`ExtendedFeaturesService`) aggregates 15 functional domains. | **Critical** | High | Medium | **P0** |
| **TD-02** | Frontend: UI Routing | God Page (`page.tsx`) contains 1,784 lines of mixed routing, state, and rendering. | **Critical** | High | High | **P0** |
| **TD-03** | Backend: Data Storage | Synchronous filesystem access (`fs.writeFileSync`) locks event loop. | **High** | High | Low | **P0** |
| **TD-04** | Frontend: Components | Flat dump of 35 React files in `components/` directory. | **Medium** | Medium | Medium | **P1** |
| **TD-05** | Backend: Routing | God Controller (`ExtendedFeaturesController`) aggregates all URL paths. | **High** | Medium | Low | **P1** |
| **TD-06** | System: Types | Primitive obsession with raw string variables for platforms and states. | **Medium** | Medium | Low | **P2** |

---

## 8. Target Repository Structure

The target repository structure adopts a **Domain-Bounded Feature Layout** for both backend and frontend. This architecture keeps related controllers, services, and UI components together, facilitating modularity and code ownership.

### Repository Layout Diagram

```text
project/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.module.ts              # Root configuration and module loading
│   │   │   ├── tenant/                    # Multi-tenant interceptors & services
│   │   │   ├── observability/             # OTel middleware & Outbox interceptors
│   │   │   └── domains/                   # Bounded business domains
│   │   │       ├── listening/             # Social Listening feature group
│   │   │       │   ├── listening.controller.ts
│   │   │       │   ├── listening.service.ts
│   │   │       │   └── listening.module.ts
│   │   │       ├── advocacy/              # Employee Advocacy feature group
│   │   │       │   ├── advocacy.controller.ts
│   │   │       │   ├── advocacy.service.ts
│   │   │       │   └── advocacy.module.ts
│   │   │       ├── experimentation/       # A/B Testing & Thompson MAB
│   │   │       │   ├── experimentation.controller.ts
│   │   │       │   ├── experimentation.service.ts
│   │   │       │   └── experimentation.module.ts
│   │   │       ├── links/                 # URL redirection and UTM generation
│   │   │       │   ├── links.controller.ts
│   │   │       │   ├── links.service.ts
│   │   │       │   └── links.module.ts
│   │   │       └── compliance/            # Security logs & auditing
│   │   │           ├── compliance.controller.ts
│   │   │           ├── compliance.service.ts
│   │   │           └── compliance.module.ts
│   ├── frontend/
│   │   └── src/
│   │       ├── app/                       # Page routes matching app shell tabs
│   │       │   ├── layout.tsx             # Shared root shell
│   │       │   ├── page.tsx               # Redirects immediately to /dashboard
│   │       │   ├── dashboard/page.tsx     # Executive Command UI
│   │       │   ├── listening/page.tsx     # Social Listening UI
│   │       │   ├── studio/page.tsx        # Composer and Media designer
│   │       │   └── personal-hub/page.tsx  # Profile twin operations
│   │       └── features/                  # Bounded components mapping to page routes
│   │           ├── listening/             # TrendPredictor.tsx, SocialListening.tsx
│   │           ├── advocacy/              # EmployeeAdvocacy.tsx
│   │           ├── studio/                # AdvancedMediaLibrary.tsx, OmniComposer.tsx
│   │           └── shared/                # AppShell.tsx, DashboardCard.tsx, UI inputs
└── docs/
    └── architecture/
        └── standards_and_roadmap.md       # This document
```

### Dependency Rules & Import Enforcement

To enforce clean boundaries between these folders, we define the following rules:

1. **Domain Isolation**:
   - Files in `domains/listening` must never import files from `domains/compliance` directly.
   - Cross-domain interactions must happen using asynchronous event streams (Kafka topics) or via Dependency Injected services declared in a domain's public API.
2. **Layer Isolation**:
   - Controllers must handle HTTP request parsing, payload validation, and responses. They must never execute SQL queries or filesystem writes.
   - Business services must contain business logic and emit outbox events. They must never directly touch raw framework contexts (e.g., Express `Request` objects).
3. **Frontend Component Boundaries**:
   - Components under `/features/[domain]` are private to that domain.
   - Reusable elements (e.g., AppShell, buttons, charts) must live in `/features/shared` and follow strict styling guidelines.

---

## 9. Engineering Standards

These standards are mandatory for all developers contributing to the repository.

### Naming Conventions

* **Files**:
  - NestJS files: `[name].[layer].ts` (e.g., `listening.service.ts`, `listening.controller.ts`).
  - React components: `[CamelCaseName].tsx` (e.g., `SocialListening.tsx`, `OmniComposer.tsx`).
* **Classes**:
  - Must use `PascalCase` with suffix indicating their framework layer (e.g., `ListeningService`, `ComplianceController`).
* **Functions & Methods**:
  - Must use `camelCase` (e.g., `getWorkspaceOrThrow()`, `shortenLink()`).
* **Interfaces & DTOs**:
  - Interfaces: `PascalCase` matching domain structures (e.g., `BrandMention`, `AuditLog`).
  - DTOs: suffix with `Dto` (e.g., `CreateABTestDto`, `ShortenLinkDto`).

### Module & Export Rules

* **Single Export Entry**:
  - Every feature domain folder must include an `index.ts` file acting as the single public gateway.
  - Direct internal imports (e.g., `import { X } from '../domains/listening/internal/helper'`) are forbidden. Use `import { X } from '../domains/listening'` instead.
* **NestJS Module Encapsulation**:
  - Only export services that are explicitly needed by other modules. Keeping providers private within their modules reduces namespace pollution.

### Dependency Hygiene

* **Allowed Imports**:
  - Business logic can import utilities, configuration services, database repositories, and shared interfaces.
* **Forbidden Imports**:
  - Framework modules must never import application-specific components (e.g., `observability/otel.middleware` must never depend on `extended-features.service`).
  - Cross-workspace import rules: Next.js frontend code must never directly import NestJS files, and vice-versa. Communicating over API endpoints is mandatory.

### Error Handling

* **Backend Error Standards**:
  - Throw context-aware NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`).
  - Never return raw database stack traces to the API client. Catch database errors at the service layer and map them to clean API error payloads:
    ```typescript
    try {
      await this.db.write(data);
    } catch (error) {
      this.logger.error('Database write failed', error.stack);
      throw new InternalServerErrorException('Resource could not be persisted');
    }
    ```
* **Frontend Error Boundaries**:
  - Wrap React layouts in custom `ErrorBoundary` components to prevent a single tab failure from crashing the entire app shell.

### Logging

* **Metadata-Enriched Ingestion**:
  - All logs must include high-cardinality metadata (tenant ID, workspace ID). Use the contextual NestJS logger:
    ```typescript
    private readonly logger = new Logger(ListeningService.name);
    this.logger.log(`Keyword added for workspace: ${workspaceId}`, { workspaceId });
    ```
  - Level usage: `error` for systems failures; `warn` for validation issues; `log` for primary operational events; `debug` for internal state tracking.

### Observability

* **OTel Integration**:
  - Every critical workflow activity (e.g., post distribution) must be wrapped in an active OpenTelemetry span.
  - Traces must carry correlation IDs across Kafka boundaries to track message flow from backend ingestion to ClickHouse batch insert.

### Testing

* **Backend Tests**:
  - Place unit tests in a adjacent `.spec.ts` file.
  - Mock external services (Kafka client, ClickHouse HTTP connections, Redis queues) using NestJS testing utilities.
* **Frontend Tests**:
  - Write Playwright E2E tests under the `tests/` folder to verify critical user paths, such as the social publishing workflow and client approvals.

### Security

* **Multi-Tenant Row-Level Security (RLS)**:
  - All SQL queries must route through transactional parameters that append `workspace_id = ?`.
* **Sanitization**:
  - Social post copy variables must pass compliance and safety validation before distribution to prevent injection attacks on target platforms.

---

## 10. Governance Rules

To ensure long-term architectural health and prevent regression, the following governance rules are active:

```
[GOVERNANCE GATES]
 Pull Request Created
   ├── 1. Circular Check (cruiser)   -> Fail if cycle detected
   ├── 2. Code Review Checklist      -> Fail if God Component added
   └── 3. Coverage Gate (jest)       -> Fail if coverage < 80%
 Merged to main
```

### Repository Governance Policy
1. **Zero Circular Dependencies**: Cyclic references are strictly banned. The build will fail if a cycle is introduced.
2. **Encapsulation Enforcement**: Features must interact over REST API, Kafka, or dependency-injected interfaces. No direct cross-domain filesystem or database manipulation.
3. **No Hardcoded Secrets**: Storing API keys, database URLs, or security tokens in plain text configurations is prohibited. The CI gate will reject commits containing credentials.
4. **Code Ownership Bounding**: Code changes modifying security interceptors or RLS modules require approval from the Principal Architect.

### Code Review Checklist
* [ ] Does the new file exceed 400 lines? If yes, it must be split.
* [ ] Are database operations isolated within a repository or data service?
* [ ] Are mock sandboxes using synchronous, blocking operations in operational paths?
* [ ] Did the developer introduce any imports that cross feature boundaries directly?
* [ ] Are log statements contextually tagged with workspace and tenant identifiers?

### Pull Request (PR) Checklist
* [ ] Code compiles and passes all TypeScript checking flags (`strict: true`).
* [ ] Unit test suite reports zero failures and maintains >80% coverage on new logic.
* [ ] Playwright E2E tests pass in a headless headless browser environment.
* [ ] Target environment variables are documented in `.env.example`.

### Architectural Review Checklist
* [ ] Does the proposed feature reuse existing platform primitives (Temporal, Kafka, ClickHouse)?
* [ ] Have new Kafka event schemas been registered under specs?
* [ ] Does the data model enforce strict separation of tenant profiles?

---

## 11. Automated Enforcement Rules

Governance policies are enforced automatically on every commit and PR using CI/CD pipelines.

### Circular Dependency Validation (`dependency-cruiser`)

We configure `dependency-cruiser` to scan the backend and frontend folders. Add the following rule validation config (`.dependency-cruiser.json` template):

```json
{
  "forbidden": [
    {
      "name": "no-circular-dependencies",
      "severity": "error",
      "comment": "Circular dependencies block clean compilation and increase coupling.",
      "from": {},
      "to": { "circular": true }
    },
    {
      "name": "no-cross-domain-imports",
      "severity": "error",
      "comment": "Feature domains must maintain isolation boundaries.",
      "from": { "path": "^apps/backend/src/domains/([^/]+)/" },
      "to": {
        "path": "^apps/backend/src/domains/([^/]+)/",
        "pathNot": "^apps/backend/src/domains/$1/"
      }
    }
  ]
}
```

### Static Analysis Rules (`ESLint`)

We configure ESLint to block direct backend-to-frontend imports and restrict layout file boundaries (`eslint.config.mjs` config snippet):

```javascript
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/no-cycle': ['error', { maxDepth: Infinity }],
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/apps/backend/**'],
          message: 'Frontend must not import backend modules directly. Connect via API.'
        }]
      }]
    }
  }
];
```

### CI/CD Quality Gates

1. **Linting & Compilation Gate**:
   - Commands: `npm run lint` and `npm run build`.
   - Action: Fail build on any warning or compile error.
2. **Quality Gate Threshold**:
   - Command: `npm run test:cov` (Jest coverage checker).
   - Validation: Fail build if coverage drops below **80%**.
3. **Secret Scan Gate**:
   - Tool: `gitleaks` or `trufflehog`.
   - Validation: Scan repository commits for credentials or private SSH keys.

---

## 12. Prioritized Remediation Plan

The technical debt identified in Section 7 is addressed systematically using this prioritized remediation matrix:

### Remediation Matrix

| Task ID | Action Description | Priority | Severity | Effort | Confidence | Success Criteria |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **RM-01** | Split `ExtendedFeaturesService` into domain services. | **P0** | Critical | Medium | High | Zero legacy references left in `ExtendedFeaturesService`. |
| **RM-02** | Decouple local JSON database sandbox from blocking synchronous operations. | **P0** | High | Low | High | Use `fs.promises` or extract writing logic to an asynchronous file writer service. |
| **RM-03** | Break down `apps/frontend/src/app/page.tsx` using Next.js routes. | **P0** | Critical | High | Medium | App shell routing uses URL state; client bundle size drops by >30%. |
| **RM-04** | Disintegrate `ExtendedFeaturesController` into sub-controllers. | **P1** | High | Low | High | Standard NestJS path mapping is fully isolated. |
| **RM-05** | Restructure frontend `components/` into feature folders. | **P1** | Medium | Medium | High | Flat component list is grouped under feature folders. |
| **RM-06** | Replace string primitives for platforms/types with TypeScript enums/types. | **P2** | Medium | Low | High | Zero raw string platform references in compiler flags. |

---

## 13. Modernization Roadmap

The remediation strategy is structured across five incremental phases to prevent service interruption:

```
[MODERNIZATION ROADMAP]
Phase 0: Immediate Hygiene  -> Clean dead code & configure ESLint gates
Phase 1: Stabilization      -> Decouple synchronous file I/O operations
Phase 2: Refactoring        -> Break God Service & God Controller into domains
Phase 3: Hardening          -> Split Next.js page into Parallel Routes
Phase 4: Target State       -> Adopt fitness checks & complete feature isolation
```

### Phase 0 — Immediate Hygiene (Weeks 1-2)
* Remove unused utility methods or legacy test scripts.
* Deploy automated ESLint boundaries and `dependency-cruiser` configs.
* Standardize global environment loading checks to prevent raw defaults.

### Phase 1 — Stabilization (Weeks 3-4)
* Decouple filesystem sandbox operations. Refactor file reads and writes inside the backend to leverage async promises (`fs.promises`), preventing event loop blockages under high simulator volumes.
* Draft unit tests for the extracted services.

### Phase 2 — Structural Refactoring (Weeks 5-8)
* Deconstruct `ExtendedFeaturesService` into dedicated files: `ListeningService`, `AdvocacyService`, `ABTestingService`, `LinksService`, `ComplianceService`.
* Decouple the monolithic controller into domain controllers mapping target URL schemes.
* Reorganize frontend flat components under feature directories.

### Phase 3 — Architecture Hardening (Weeks 9-12)
* Deconstruct the 85KB Next.js landing page. Move layouts and logic into separate Next.js route components (`/dashboard`, `/listening`, `/studio`).
* Implement React Suspense and loading indicators to speed up page loads.

### Phase 4 — Target State (Months 4+)
* Enforce automated quality gates on all repositories.
* Transition telemetry services from in-memory file sandbox backups to actual ClickHouse and Kafka instances in production.

---

## 14. Success Metrics

The success of this architectural modernization is measured using the following Key Performance Indicators (KPIs):

1. **Client Page Load Optimization**:
   - Initial JavaScript bundle size decreased by **30% or more**.
   - Time to Interactive (TTI) on client dashboard reduced from $\ge 2.5$s to **$\le 1.2$s**.
2. **Developer Velocity & Clean Boundaries**:
   - Average pull request size reduced to **under 300 lines of code**.
   - Zero circular dependencies reported in CI pipelines.
3. **Robust Testing Profiles**:
   - Code coverage on core domain services reaches or exceeds **80%**.
   - Parallel test execution times reduced by **50%** due to isolated dependency injection mock setups.
4. **Platform Reliability**:
   - Blockages on the Node.js event loop drop to **zero** due to asynchronous file sandbox operations.
   - Cross-tenant context leakage events remain at **zero**.

---

## Target Implementation Examples

Below are concrete examples of target implementations to illustrate the refactoring strategies.

### Target Service Implementation Example (RM-01 & RM-02)

Here is the decoupled, async-safe, and focused target service for social listening (`ListeningService`):

```typescript
// apps/backend/src/domains/listening/listening.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface BrandMention {
  id: string;
  workspaceId: string;
  content: string;
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  timestamp: string;
  ticketCreated: boolean;
  ticketId?: string;
}

@Injectable()
export class ListeningService {
  private readonly logger = new Logger(ListeningService.name);
  private readonly filePath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'extended-features-sandbox.json',
  );

  /**
   * Retrieves all brand mentions matching a specific workspace boundary
   */
  async getMentions(workspaceId: string): Promise<BrandMention[]> {
    try {
      const data = await this.readSandboxData();
      return (data.mentions || []).filter(
        (m: BrandMention) => m.workspaceId === workspaceId,
      );
    } catch (error) {
      this.logger.error(`Failed to get mentions for workspace ${workspaceId}`, error);
      throw new BadRequestException('Failed to load telemetry mentions.');
    }
  }

  /**
   * Converts a brand mention into an actionable ticket
   */
  async convertMentionToTicket(workspaceId: string, mentionId: string): Promise<BrandMention> {
    const data = await this.readSandboxData();
    const mention = (data.mentions || []).find(
      (m: BrandMention) => m.id === mentionId && m.workspaceId === workspaceId,
    );

    if (!mention) {
      throw new BadRequestException('Mention not found in workspace.');
    }

    mention.ticketCreated = true;
    mention.ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    
    await this.writeSandboxData(data);
    this.logger.log(`Created ticket ${mention.ticketId} for mention ${mentionId}`);
    return mention;
  }

  private async readSandboxData(): Promise<any> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.warn('Sandbox file empty or missing. Returning default structure.');
      return { mentions: [], settings: {} };
    }
  }

  private async writeSandboxData(data: any): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to write sandbox data asynchronously', error);
      throw new Error('Sandbox database write exception.');
    }
  }
}
```

### Target Controller Implementation Example (RM-04)

Here is the decoupled and focused controller for social listening:

```typescript
// apps/backend/src/domains/listening/listening.controller.ts
import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { TenantService } from '../../tenant/tenant.service';
import { ListeningService } from './listening.service';

@Controller('api/v1/listening')
export class ListeningController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly listeningService: ListeningService,
  ) {}

  private getWorkspaceOrThrow(): string {
    const workspaceId = this.tenantService.getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Missing active workspace context header');
    }
    return workspaceId;
  }

  @Get('mentions')
  async getMentions() {
    const ws = this.getWorkspaceOrThrow();
    return this.listeningService.getMentions(ws);
  }

  @Post('ticket')
  async convertToTicket(@Body() body: { mentionId: string }) {
    const ws = this.getWorkspaceOrThrow();
    if (!body.mentionId) {
      throw new BadRequestException('Mention ID is required');
    }
    return this.listeningService.convertMentionToTicket(ws, body.mentionId);
  }
}
```
