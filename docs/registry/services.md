# Service Registry

Living summary of all API services. Update this file when creating, updating, or deleting a service.

| Service | Class | Base Path | Methods | Models |
|---------|-------|-----------|---------|--------|
| User Organization | `UserOrganizationService` | `/user-organization/auth` | `signIn()`, `logout()`, `forgetPassword()`, `resetPassword()` | `@models/auth/user-organization.interface` |
| Tokens | `TokensService` | `/tokens` | `getAll()`, `create()`, `deleteById()` | `@models/tokens/tokens.interface` |
