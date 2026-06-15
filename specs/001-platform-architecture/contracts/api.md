# API Interface Contracts

This document defines the REST API endpoints exposed by the Fluxora API Gateway for core services in Phase 1.

All endpoints require authorization via an OIDC JWT. The Gateway injects workspace ID headers derived from JWT claims:
* `X-Tenant-ID`: Identifies the organization.
* `X-Workspace-ID`: Identifies the current workspace context.

---

## 1. Workspace Onboarding & Management

### `POST /api/v1/workspaces`
* **Description**: Create a new workspace under the current tenant.
* **Headers**:
  * `Authorization: Bearer <JWT>`
* **Request Payload**:
  ```json
  {
    "name": "Acme Brand Campaign"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "ws_991823ab-2023",
    "tenantId": "tn_11029312-0091",
    "name": "Acme Brand Campaign",
    "createdAt": "2026-06-15T00:00:00Z"
  }
  ```

---

## 2. Connected Accounts

### `POST /api/v1/accounts/oauth/callback`
* **Description**: Complete OAuth authorization and save tokens to Vault.
* **Request Payload**:
  ```json
  {
    "provider": "linkedin",
    "code": "auth_code_example",
    "redirectUri": "http://localhost:3000/callback"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": "acc_339182ab-2023",
    "provider": "linkedin",
    "name": "Acme Corp LinkedIn",
    "avatarUrl": "https://avatar.example/acme.png",
    "status": "ACTIVE"
  }
  ```

---

## 3. Post Scheduling

### `POST /api/v1/posts`
* **Description**: Compose and schedule a post with variants.
* **Request Payload**:
  ```json
  {
    "content": "Check out our latest release!",
    "scheduledAt": "2026-06-19T09:00:00Z",
    "variants": [
      {
        "platform": "linkedin",
        "overrideContent": "Check out our latest enterprise release on LinkedIn!"
      },
      {
        "platform": "twitter",
        "overrideContent": "Check out our latest release! #tech"
      }
    ]
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "pst_887162bc-9011",
    "content": "Check out our latest release!",
    "scheduledAt": "2026-06-19T09:00:00Z",
    "status": "Scheduled",
    "createdAt": "2026-06-15T00:00:00Z"
  }
  ```

---

## 4. Telemetry and Performance Analytics

### `GET /api/v1/analytics/performance`
* **Description**: Retrieve aggregated performance metrics from ClickHouse.
* **Parameters**:
  * `startDate`: ISO 8601 Date
  * `endDate`: ISO 8601 Date
  * `platforms`: Array of platform filters
* **Response (200 OK)**:
  ```json
  {
    "views": 15420,
    "clicks": 1820,
    "shares": 310,
    "byPlatform": {
      "linkedin": {
        "views": 8420,
        "clicks": 900
      },
      "twitter": {
        "views": 7000,
        "clicks": 920
      }
    }
  }
  ```
