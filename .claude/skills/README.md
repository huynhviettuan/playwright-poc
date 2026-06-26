# Skills

How-to guides for common framework tasks. Each skill is self-contained; open the one that matches your task.

## By purpose

### Discovery

Find what's on a screen, then turn requirements + observations into test cases.

-   [`explore-screens.md`](./explore-screens.md) — inspect a live screen, capture UI locators + API endpoints in one
    pass
-   [`generate-test-cases.md`](./generate-test-cases.md) — read the user story, explore the screen, produce
    `docs/test-cases/<feature>.md`

### Creation

Build new framework artifacts.

-   [`create-page-object.md`](./create-page-object.md) — container-based page object (Header / Main / Footer)
-   [`create-custom-element.md`](./create-custom-element.md) — extend `BaseControl` / `Clickable` / `Editable` for new
    UI primitives
-   [`create-api-service.md`](./create-api-service.md) — service class extending `BaseService` for HTTP operations
    (controller pattern)
-   [`create-service-from-swagger.md`](./create-service-from-swagger.md) — generate service + types + fixtures from a
    Swagger/OpenAPI spec

### Writing tests

Author the test files themselves.

-   [`write-e2e-test.md`](./write-e2e-test.md) — E2E test against page objects via custom fixtures
-   [`write-api-test.md`](./write-api-test.md) — API test against service classes via custom fixtures
-   [`write-a11y-test.md`](./write-a11y-test.md) — accessibility test using `@axe-core/playwright` via `a11y` fixture
-   [`write-behavior-test.md`](./write-behavior-test.md) — behavior-style `Given/When/Then` specs via built-in
    `test.step()` + typed DSL (recommended for BA/PO sign-off)
-   [`write-bdd-test.md`](./write-bdd-test.md) — Gherkin `.feature` scenarios via `playwright-bdd` (conditional; only if
    stakeholders author features)

### Test infrastructure

Patterns that make the suite fast, isolated, and parallel-safe.

-   [`use-auth-state.md`](./use-auth-state.md) — log in once, reuse session via Playwright `storageState`
-   [`mock-network.md`](./mock-network.md) — intercept HTTP with `page.route()` for edge-case coverage
-   [`manage-test-data.md`](./manage-test-data.md) — factories + auto-cleanup fixture for isolated state
-   [`configure-notifications.md`](./configure-notifications.md) — CI test result notifications via Observer pattern
    (Slack, Teams, email, webhook)
-   [`manage-environments.md`](./manage-environments.md) — multi-environment config (dev, staging, production) via
    `.env.*` files
-   [`manage-database.md`](./manage-database.md) — PostgreSQL seed/query/cleanup via `db` fixture
-   [`setup-ci.md`](./setup-ci.md) — CI/CD pipeline setup for GitHub Actions and GitLab CI (sharding, scheduling,
    multi-env)

### Cross-cutting workflows

Use throughout the framework, not tied to one artifact type.

-   [`use-helper-functions.md`](./use-helper-functions.md) — `DateTimeHelper`, `DataGenerator`, `ExcelHelper`, etc.
-   [`work-with-email.md`](./work-with-email.md) — email verification flows using `Mail` and `MailSubjects`

### Observability

Monitor and diagnose test infrastructure health.

-   [`health-locator.md`](./health-locator.md) — RAG + vector DB system to detect broken locators and suggest fixes

### Quality

Review and maintain code quality.

-   [`code-review.md`](./code-review.md) — full code review checklist covering framework patterns, clean code, test
    quality, bug detection, and readability
-   [`debug-tests.md`](./debug-tests.md) — step-by-step debugging workflow for failing, flaky, and CI-specific test
    failures

### Maintenance

Modify existing code without changing what it does.

-   [`refactor-code.md`](./refactor-code.md) — repo-agnostic refactoring methodology with playwright-poc-specific
    recipes
-   [`refactor-code-follow-skills.md`](./refactor-code-follow-skills.md) — systematic checklist to migrate legacy
    automation code to follow all skills

## Typical flow

```
user story  →  generate-test-cases  →  docs/test-cases/<feature>.md
                       │
                       ▼ (delegates exploration)
              explore-screens
                ├──────────────┐
                ▼              ▼
       create-page-object   create-api-service
                │              │
                ▼              ▼
       write-e2e-test       write-api-test
              ↑
       create-custom-element   (when the screen needs a primitive that doesn't exist)

Setup once per suite:  use-auth-state              (fast, deterministic login)
Per-test, as needed:   manage-test-data            (factories + cleanup)
                       mock-network                (control backend responses)
                       use-helper-functions        (date, random data, excel)
                       work-with-email             (verification emails)
```

## Conventions

-   **Skill vs guidance** — a skill is a _step-by-step recipe_ for building or testing something. Conceptual background
    and pattern explanations live in [`../../docs/guidance/`](../../docs/guidance/).
-   **Fixtures** — every test must import `test` and `expect` from `@fixtures/fixtures`. See
    [ADR-002](../../docs/decisions/ADR-002-custom-fixtures.md).
-   **Path aliases** — always prefer `@pages/*`, `@elements/*`, etc. over relative imports.
-   **Naming** — skills use `verb-noun.md`. Names are stable so users can invoke them by slash command without
    surprises.
