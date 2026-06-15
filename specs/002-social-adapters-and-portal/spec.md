# Feature Specification: Social Adapters & Client Approval Portal

**Feature Branch**: `002-social-adapters-and-portal`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Implement Wave 1.1: Core Social Adapter Transition & Vault Integration, and Wave 1.2: Client Approval Portal MVP. Secure credentials in Vault, transition mock adapters to real publishing logic, and build the Next.js client portal with approval gates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure OAuth Token Ingestion & Rotation (Priority: P1)

A Social Media Manager (Marketing Mary) connects a brand account (LinkedIn, Facebook, or Twitter/X). The system completes the OAuth consent loop, writes the tokens to HashiCorp Vault, and saves only the Vault reference ID and expiration details in the PostgreSQL database.

**Why this priority**: Essential for security and token management. It blocks unauthorized access to client tokens.

**Independent Test**: Can be validated by completing a mock OAuth connection or sending a POST to the connection endpoint, and verifying that the PostgreSQL `ConnectedAccount` record has `vaultSecretId` set and clear-text token fields are `null`. Then, reading the keys directly from the HashiCorp Vault HTTP API using the secret ID to confirm they match.

**Acceptance Scenarios**:
1. **Given** a user triggers connection for LinkedIn, **When** the OAuth flow returns tokens, **Then** tokens are saved to `secret/data/workspaces/accounts/account-[id]` in Vault, and the local `ConnectedAccount` has `vaultSecretId = "account-[id]"`.
2. **Given** an expired or expiring token, **When** the background token lifecycle activity runs, **Then** it fetches the refresh token from Vault, requests a new access token from the social network, updates Vault, and records the new expiration in PostgreSQL.

---

### User Story 2 - Real Social Publishing Integration (Priority: P1)

A Content Creator schedules a post variant for LinkedIn and Twitter/X. The Temporal publishing workflow picks up the post at the scheduled time, retrieves the access token from HashiCorp Vault, formats the payload according to each platform's rules, and publishes it via standard API calls.

**Why this priority**: Core functionality of the platform.

**Independent Test**: Can be validated by executing a scheduled publishing workflow and confirming that the social networks receive the payloads with correct structure and the post status updates to `Published`.

**Acceptance Scenarios**:
1. **Given** a scheduled post reaches its epoch, **When** the publishing activity runs, **Then** it requests the token from `VaultService`, posts the content to LinkedIn and Twitter/X endpoints, and saves the external post IDs and URLs in `PostVariant`.
2. **Given** a social platform API returns a rate-limit error, **When** the publishing adapter receives the error, **Then** it throws an exception that Temporal catches to execute backoff retries with anti-ban stagger logic.

---

### User Story 3 - Client Portal Approval Loop (Priority: P1)

An Agency Creator drafts a post and marks it as `Pending Approval`. The system generates a secure review token and emails a tokenized link to the client. The client opens the link, reviews the content and previews, and clicks "Approve", which updates the status to `Scheduled` and queue-dates it.

**Why this priority**: Major differentiator for agency operations.

**Independent Test**: Can be validated by marking a post draft as pending approval, generating a secure token, visiting `/approval/[token]`, clicking "Approve", and verifying the post transitions to `Scheduled` in PostgreSQL.

**Acceptance Scenarios**:
1. **Given** a post draft, **When** the creator clicks "Send for Approval", **Then** the post enters `PendingApproval` status, a Temporal workflow starts, and a unique JWT token is generated.
2. **Given** a client visits the approval page with a valid token, **When** they click "Approve", **Then** the backend receives the signature, transitions the post to `Scheduled`, triggers the scheduling timer workflow, and updates the status logs.
3. **Given** a client clicks "Reject" and provides feedback text, **When** submitted, **Then** the post returns to `Draft` status and the feedback is logged in the post activity history.

---

## Edge Cases

- **Token Revocation during Workflow execution**: If a token is invalidated by the user or platform before/during a post attempt, the workflow must catch this specific error, update the account status in PostgreSQL to `REQUIRES_RECONNECT`, notify the workspace, and fail the post gracefully rather than retrying.
- **Malformed URL / Expired Portal Link**: If a client visits an expired or tampered token link, the portal must display a clear "Link Expired / Invalid" error page with an option to request a new link.
- **Simultaneous Client Actions**: If two clients attempt to review the same post at the same time, the first decision must be processed, and the second visitor must see a message indicating the post has already been approved/rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST write all OAuth credentials (access token, refresh token, expiry) to HashiCorp Vault under the path `secret/data/workspaces/accounts/account-[id]`.
- **FR-002**: System MUST store only the Vault secret reference ID in the PostgreSQL `ConnectedAccount` table.
- **FR-003**: The `SocialAdaptersService` MUST implement standard HTTP calls to publish posts on:
  - LinkedIn Page Share API (`/v2/shares` or `/ugcPosts`)
  - Twitter/X Status Creation API (`/2/tweets`)
  - Facebook Page Feed Post API (`/{page-id}/feed`)
- **FR-004**: System MUST intercept rate-limiting headers (e.g. `x-rate-limit-remaining`) from social APIs and throw standard NestJS `HttpException` with status code 429 to trigger Temporal retry/stagger routines.
- **FR-005**: System MUST provide an API endpoint to generate secure, cryptographically signed approval tokens (JWTs) containing `workspaceId`, `postId`, and expiry.
- **FR-006**: The Next.js client approval page MUST read the JWT token, verify its signature, and render the post content and platforms previews.
- **FR-007**: System MUST support feedback text entry upon rejection and write it to the database before reverting the post to `Draft`.

### Key Entities

- **ConnectedAccount**: Represents connected social profile metadata. Extended with:
  - `vaultSecretId` (String, reference to Vault secret path)
  - `tokenExpiresAt` (DateTime, local database reference cache)
- **ApprovalToken**: Cryptographically signed token mapped to a post. Key attributes:
  - `postId` (String)
  - `workspaceId` (String)
  - `expiresAt` (DateTime)
  - `status` (Enum: PENDING, APPROVED, REJECTED)
- **Post**: Represents scheduling content. State machine transitions extended to support:
  - `Draft` → `PendingApproval` → `Scheduled` → `In-Flight` → `Published`/`Failed`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of social media access tokens are securely read and written through the HashiCorp Vault service.
- **SC-002**: Posting latency from the scheduled execution time to external API response is under 3 seconds per platform.
- **SC-003**: The Client Portal page loads and verifies the token signature in under 800ms.
- **SC-004**: Rejection feedback is stored in PostgreSQL and updates the creator's dashboard instantly.

## Assumptions

- **A-001**: The social platform APIs (LinkedIn, Twitter/X, Facebook) remain stable and accept standard OAuth 2.0 Bearer tokens.
- **A-002**: The HashiCorp Vault cluster has the KV-v2 secret engine mounted at `secret/`.
- **A-003**: Next.js 15 is configured to parse dynamic parameter routing for `[token]` pages.
