# Research: Custom Domains & Email Notifications

## Custom Domain Host Header Mapping

### Decision
Use a NestJS dynamic interceptor (`TenantInterceptor`) to capture the incoming `Host` header, resolve it against the database `Workspace` table for custom domain entries, and set the request-scoped tenant context.

### Rationale
- Kong Gateway passes the original `Host` header to backend microservices.
- Intercepting at the backend entrypoint (`TenantInterceptor`) allows us to resolve the domain to a `workspaceId` cleanly and transparently before any controllers execute.
- Keeps domain configuration dynamic, avoiding static gateway configuration reload cycles.
- RLS policies on PostgreSQL will automatically apply because the context is set globally per request.

### Alternatives Considered
- **Gateway-level routing (Kong ingress paths)**: Requires dynamic upstream updating and mapping in Kong database, adding setup complexity. Rejected due to high operational complexity.
- **Subdomain routing only**: Simple, but doesn't support actual custom domains (e.g., `agency.com` vs `agency.fluxora.com`).

---

## Email Notification Sandbox in Development

### Decision
Adopt a local file-system and console-based mock mailer for local development. Write outbound email payloads to files under `apps/backend/logs/mail-sandbox/` and log notification details to NestJS Logger.

### Rationale
- Decouples development from active SaaS APIs (Resend, SendGrid) or running local SMTP servers, removing token configuration steps.
- Safe, offline-capable verification of email templates and dynamic URL tokens.
- Simple drop-in replacement with `@nestjs-modules/mailer` or Resend SDK for production.

### Alternatives Considered
- **Maildev / Mailhog Docker containers**: Adds another container to `docker-compose.infra.yaml`. Rejected to minimize development footprint and ensure ease of running tests offline.
