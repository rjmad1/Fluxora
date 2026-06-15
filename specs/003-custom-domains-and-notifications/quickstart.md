# Quickstart Validation Guide: Custom Domains & Email Notifications

This guide outlines runnable scenarios to verify the functionality of custom domain routing and email notification alerts.

## Prerequisites

1. PostgreSQL database running.
2. Generate and apply Prisma migrations:
   ```bash
   npx prisma migrate dev --name add_custom_domains_and_notifications
   ```

---

## Validation Scenario 1: Custom Domain Request Routing

1. **Database Setup**: Insert a workspace with `customDomain` set to `reviews.agency.local`:
   ```sql
   UPDATE "Workspace" SET "customDomain" = 'reviews.agency.local' WHERE id = 'ws-1';
   ```

2. **Trigger Request**: Send a request using `Host: reviews.agency.local`:
   ```bash
   curl -H "Host: reviews.agency.local" http://localhost:8000/api/v1/posts
   ```

3. **Expected Outcome**: The request resolves successfully, setting the tenant/workspace context to `ws-1` based on the database mapping, without needing the `X-Workspace-ID` header.

---

## Validation Scenario 2: Email Approval Notifications

1. **Database Setup**: Set notification configurations:
   ```sql
   INSERT INTO "WorkspaceNotificationSettings" ("id", "workspaceId", "clientEmail") 
   VALUES ('settings-1', 'ws-1', 'client@example.com');
   ```

2. **Create and Submit Post**: Submit a post draft with creator email set to `creator@example.com`:
   ```bash
   curl -X POST http://localhost:8000/api/v1/posts/post-id/approval-token
   ```

3. **Check Mail Sandbox**:
   Open the directory `apps/backend/logs/mail-sandbox/` and verify that a file was created containing:
   - To: `client@example.com`
   - Content: A secure link of format `/approval/[token]`.

4. **Submit Approval Decision**: Submit decision on the post:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/posts/approval/submit?token=[token]" \
     -H "Content-Type: application/json" \
     -d '{"action": "approve"}'
   ```

5. **Verify Decision Email**:
   Check `apps/backend/logs/mail-sandbox/` and verify that a new file was created notifying `creator@example.com` that their post was approved.
