---
description: Create an API service extending BaseService
argument-hint: <resource name> [swagger url/path]
---

Read `.claude/skills/create-api-service.md`, then create an API service for: **$ARGUMENTS**

Requirements:

-   Service class extends `BaseService` and follows the controller pattern.
-   Add request/response types under `src/models`.
-   Add endpoints to the endpoints constant (`@constants/endpoints.constant`).
-   Register the service in `src/fixtures/fixtures.ts`.
-   Use path aliases, never relative imports.

If a Swagger/OpenAPI URL or path was provided, read `.claude/skills/create-service-from-swagger.md` and generate the
service, types, and fixtures from the spec instead.
