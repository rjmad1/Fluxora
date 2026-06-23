# Contributor Guidelines

Thank you for contributing to Fluxora. To maintain high code quality, security standards, and architectural alignment, all contributions must follow the guidelines detailed below.

---

## 🏛️ Code Architecture Alignment

1. **Governance Gate:** We follow the **Adopt → Extend → Wrap → Fork → Build** priority model. Before implementing new utilities, verify if they exist in pre-approved stacks (e.g. keycloak, vault, temporal).
2. **Domain-Driven Design:** Keep service scopes clean. Place feature code inside their business domains (e.g. `apps/backend/src/publishing`), never organized around specific UI pages.
3. **Sacred Isolation:** Ensure every database query and payload includes validation checks matching the user's `tenantId` and `workspaceId` parameters.

---

## 🛠️ Local Development & QA Standards

### 1. Code Style and Formatting
- Format code using prettier:
  ```bash
  npm run format
  ```
- Check linting rules:
  ```bash
  npm run lint
  ```

### 2. TypeScript and Type Safety
- Avoid using `any` types. Specify explicit interfaces and types for DTOs and API responses.
- Ensure that NestJS controllers leverage validation decorators (`class-validator`) to sanitize incoming requests.

---

## 📥 Pull Request Checklist

Before submitting a Pull Request, verify that:

- [ ] Local tests pass successfully (`npm run test:backend`).
- [ ] Linting and prettier checks report no errors.
- [ ] No temporary credential files or `.env` files are tracked.
- [ ] Gitleaks scans find no hardcoded secrets or access keys.
- [ ] You have updated the corresponding documentation if adding environment variables or database models.
