# API Contracts: Analytics & Telemetry

This document defines the REST API endpoints for the analytics metrics and telemetry simulation.

## 1. Get Workspace Performance Metrics

Retrieve aggregated metrics (views, clicks, shares) filtered by date range and platforms.

- **URL**: `/api/v1/analytics/performance`
- **Method**: `GET`
- **Headers**:
  - `x-workspace-id`: `[workspaceId]` (Mandatory context header)
- **Query Parameters**:
  - `startDate`: `ISO 8601 string` (Optional)
  - `endDate`: `ISO 8601 string` (Optional)
  - `platforms`: `string` (Optional, comma-separated list, e.g., `linkedin,twitter`)

### Success Response (200 OK)

```json
{
  "views": 150,
  "clicks": 45,
  "shares": 12,
  "byPlatform": {
    "linkedin": {
      "views": 80,
      "clicks": 25,
      "shares": 5
    },
    "twitter": {
      "views": 70,
      "clicks": 20,
      "shares": 7
    }
  }
}
```

---

## 2. Simulate Telemetry Event

Inject a mock event (click, view, share) into the telemetry stream for testing.

- **URL**: `/api/v1/analytics/simulate`
- **Method**: `POST`
- **Headers**:
  - `x-workspace-id`: `[workspaceId]` (Mandatory context header)
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "postId": "string (optional)",
    "platform": "string (linkedin | twitter | facebook)",
    "eventType": "string (post.click | post.impression | post.share)"
  }
  ```

### Success Response (200 OK)

```json
{
  "success": true,
  "eventId": "uuid-string"
}
```

> **Security Note**: This endpoint should be rate-limited in production to prevent abuse. Consider restricting access to development/staging environments or authenticated admin users only.

---

## 3. Get Campaign ROI Metrics

Retrieve calculated ROI metrics including ad spend, revenue, and profit margins for a workspace.

- **URL**: `/api/v1/analytics/roi`
- **Method**: `GET`
- **Headers**:
  - `x-workspace-id`: `[workspaceId]` (Mandatory context header)
- **Query Parameters**:
  - `startDate`: `ISO 8601 string` (Optional)
  - `endDate`: `ISO 8601 string` (Optional)

### Success Response (200 OK)

```json
{
  "workspaceId": "ws-1",
  "views": 1500,
  "clicks": 450,
  "adSpend": 6.0,
  "generatedRevenue": 270.0,
  "netProfit": 264.0,
  "roiPercentage": 4400.0,
  "stripeConnected": false
}
```

### Fields

| Field | Type | Description |
|:---|:---|:---|
| `workspaceId` | string | The workspace being queried |
| `views` | number | Total impression/view events |
| `clicks` | number | Total click events |
| `adSpend` | number | Estimated ad spend (mock baseline or Stripe-connected) |
| `generatedRevenue` | number | Estimated revenue from clicks |
| `netProfit` | number | `generatedRevenue - adSpend` |
| `roiPercentage` | number | `(netProfit / adSpend) * 100` |
| `stripeConnected` | boolean | Whether Stripe API key is configured |

