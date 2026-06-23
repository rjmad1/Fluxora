# Administrator Administration Manual: Fluxora Security & Tenancy

This guide describes how to configure the platform's core identity configurations, credential vaults, and tenant parameters.

---

## 🔑 Keycloak IAM Setup

Keycloak acts as the primary OIDC and OAuth2 provider. The default configuration file is located at `./infra/keycloak`.

### 1. Realm Configuration
- **Realm Name:** `fluxora`
- **Clients:**
  - `frontend`: Public client configuring Next.js browser sessions. Redirect URIs: `http://localhost:3001/*`.
  - `backend`: Confidential client configuring NestJS API scopes. Redirect URIs: `http://localhost:3000/*`.
- **Client Scopes:** Add standard scopes `openid`, `profile`, `email`, and ensure custom claim mappings populate `workspaceId` and `tenantId` parameters inside user session tokens.

### 2. User Mappings & RBAC Roles
- Define role hierarchy: `SuperAdmin`, `WorkspaceAdmin`, `Creator`, `Viewer`.
- Set user attributes to map specific workspace configurations.

---

## 🔒 HashiCorp Vault Credentials Setup

Fluxora stores client social credentials inside **HashiCorp Vault**'s KV (Key-Value) secrets engine to prevent transactional database leaks.

### 1. Secrets KV Mount
Ensure the Key-Value secrets engine is mounted at `secret/`:
```bash
vault secrets enable -path=secret kv-v2
```

### 2. OAuth Secret Paths
- Paths match the structure: `secret/data/workspaces/accounts/account-<accountId>`
- JSON fields stored in paths:
  ```json
  {
    "accessToken": "secret-oauth-access-token",
    "refreshToken": "secret-oauth-refresh-token",
    "expiresAt": "2026-06-23T12:00:00Z"
  }
  ```

### 3. Policy Configurations
To allow NestJS APIs to retrieve vaulted tokens, assign this policy to the API gateway token:
```hcl
path "secret/data/workspaces/accounts/*" {
  capabilities = ["create", "read", "update", "delete"]
}
path "secret/metadata/workspaces/accounts/*" {
  capabilities = ["delete"]
}
```

---

## 🏢 Multi-Tenant Database Isolation

Fluxora implements row-level security (RLS) and schema isolation in PostgreSQL to guarantee strict data boundaries:

1. **Isolation Keys:** Every record in database tables like `ConnectedAccount`, `Post`, and `Asset` must contain columns for `tenant_id` and `workspace_id`.
2. **Context Injection:** When requests pass through the **Kong Gateway**, the gateway validates the caller's Keycloak JWT, extracts the tenant attributes, and sets the transaction config headers in the database connection:
   ```sql
   SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
   SET LOCAL app.current_workspace_id = 'workspace-uuid-here';
   ```
3. **RLS Policies:** The schema database enforces constraints dynamically:
   ```sql
   CREATE POLICY workspace_scoping_policy ON "Post"
     USING (workspace_id = current_setting('app.current_workspace_id'));
   ```
   *No cross-workspace or cross-tenant reads/writes are allowed. If the session headers are missing, PostgreSQL blocks all database records.*
