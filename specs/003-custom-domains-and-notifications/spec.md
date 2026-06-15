# Feature Specification: Custom Domains & Email Notifications

**Feature Branch**: `003-custom-domains-and-notifications`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Implement Wave 2: Agency Operating System - Email Notification Service and Custom Domain Dynamic Routing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Email Notification on Pending Approval (Priority: P1)

A Social Media Manager (SMM) prepares a post draft for their client and clicks "Submit for Approval". The system automatically transitions the post status to `PendingApproval`, generates a secure client-portal URL (cryptographically tokenized), and sends an email notification containing this link to the client.

**Why this priority**: Crucial first step of the agency approval loop. Without automated delivery, creators must manually copy and email links.

**Independent Test**: Transition a post draft to `PendingApproval` status via the API and verify that an email is successfully dispatched containing the correct dynamic URL matching the generated token.

**Acceptance Scenarios**:
1. **Given** a post draft in a workspace with a configured client email, **When** the post is submitted for approval, **Then** the post enters `PendingApproval` status, a secure approval token is created, and an email is triggered containing the URL `/approval/[token]`.
2. **Given** a post submission, **When** the email dispatch fails, **Then** the system logs the failure, fails gracefully, but the post remains in `PendingApproval` so that the link can still be retrieved manually from the UI.

---

### User Story 2 - Custom Domain Mapping & Routing (Priority: P1)

An Agency Admin configures a custom domain (e.g. `portal.awesomeagency.com`) for their workspace. When a client visits this domain, the reverse proxy and NestJS application resolve the incoming request `Host` header, locate the corresponding workspace database record, and serve the client approval portal configured for that workspace without requiring explicit header injection of `X-Workspace-ID`.

**Why this priority**: Core white-label branding requirement for digital agencies.

**Independent Test**: Make a request to the backend API with `Host: portal.awesomeagency.com` and verify that the response returns the metadata context corresponding to the configured workspace.

**Acceptance Scenarios**:
1. **Given** a workspace configured with the custom domain `portal.awesomeagency.com`, **When** a client sends a request to the API with the header `Host: portal.awesomeagency.com`, **Then** the system resolves the tenant and workspace context, setting the PostgreSQL RLS context to that workspace.
2. **Given** a custom domain request, **When** the domain does not exist or matches no workspace, **Then** the system falls back to the default platform host or returns a 404 error if accessing a tenant-scoped path.

---

### User Story 3 - Client Approval Decision Notification (Priority: P2)

A client visits their branded approval portal, reviews a pending post, and clicks either "Approve" or "Reject". After their action is processed, the system sends an email notification back to the original post creator (SMM), notifying them of the client's decision and attaching any feedback/rejection comments.

**Why this priority**: Completes the feedback loop so the SMM is notified immediately to schedule publishing or edit rejected content.

**Independent Test**: Submit a decision (approve/reject) via the client portal token validation endpoint and verify that an email notification is dispatched to the creator containing the post status and comments.

**Acceptance Scenarios**:
1. **Given** a post in `PendingApproval`, **When** the client rejects the post and provides feedback "Change the image", **Then** the post transitions to `Rejected`, and the creator receives an email with the feedback.
2. **Given** a post in `PendingApproval`, **When** the client approves the post, **Then** the post transitions to `Scheduled`, and the creator receives an email notifying them of the approval.

---

## Edge Cases

- **Unconfigured Client Email**: If a post is submitted for approval but the workspace has no client email configured, the system must allow the submission but flag a warning that no email was sent.
- **Dynamic Host Header Hijacking**: If an attacker sends a spoofed `Host` header to the API gateway, the gateway and backend must validate the host name against registered domains and verify SSL certificate binding.
- **Port stripping**: When resolving hostnames, the system must properly strip ports (e.g., `portal.awesomeagency.com:3000` -> `portal.awesomeagency.com`) to match database records accurately in development and test environments.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support sending HTML email notifications containing the client approval link when a post transitions to `PendingApproval` status.
- **FR-002**: System MUST send email notifications to the creator of a post when a client approves or rejects the post.
- **FR-003**: System MUST store a `customDomain` (String, unique, optional) on the `Workspace` model.
- **FR-004**: The `TenantInterceptor` MUST inspect the incoming request `Host` header: if the host is not the default API gateway host, it must search for a matching `customDomain` in the database and bind the resolved `workspaceId` and `tenantId` to the request context.
- **FR-005**: System MUST validate that configured custom domains are in a valid hostname format and do not overlap with platform-reserved domains.
- **FR-006**: In development and test environments, the system MUST write sent emails to a local sandbox log file (or console) to simulate delivery without calling external APIs.

### Key Entities

- **Workspace**: Extended with:
  - `customDomain` (String, unique, optional)
- **Post**: Extended with:
  - `createdByEmail` (String, optional, to track who created the post for notifications)
- **WorkspaceNotificationSettings**: Represents notification configuration (e.g., client email addresses, creator email addresses). Key attributes:
  - `workspaceId` (String)
  - `clientEmail` (String)
  - `notifyOnDecision` (Boolean)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Email notifications are queued and dispatched within 3 seconds of a post status transition.
- **SC-002**: Custom domain resolution interceptor processes host matching in under 1ms overhead per request.
- **SC-003**: 100% of test requests using a custom `Host` header map to the correct database tenant and workspace boundaries under PostgreSQL RLS policies.
- **SC-004**: System handles port numbers in development `Host` headers cleanly, matching correctly.

## Assumptions

- We assume that DNS resolution and SSL/TLS termination for custom domains are handled by the outer reverse proxy / Kong gateway, and the backend receives the validated `Host` header.
- For local development, we will mock email delivery by writing messages to the logs and to a temporary sandbox directory `apps/backend/logs/mail-sandbox/`.
