# Skills

How-to guides for common framework tasks. Each skill is self-contained; open the one that matches your task.

## By purpose

### Discovery
Find what's on a screen before you build anything for it.

-   [`explore-screens.md`](./explore-screens.md) — inspect a live screen, capture locators, hand off to `create-page-object`

### Creation
Build new framework artifacts.

-   [`create-page-object.md`](./create-page-object.md) — container-based page object (Header / Main / Footer)
-   [`create-custom-element.md`](./create-custom-element.md) — extend `BaseControl` / `Clickable` / `Editable` for new UI primitives
-   [`create-api-service.md`](./create-api-service.md) — service class extending `BaseService` for HTTP operations

### Writing tests
Author the test files themselves.

-   [`write-e2e-test.md`](./write-e2e-test.md) — E2E test against page objects via custom fixtures
-   [`write-api-test.md`](./write-api-test.md) — API test against service classes via custom fixtures

### Test infrastructure
Patterns that make the suite fast, isolated, and parallel-safe.

-   [`use-auth-state.md`](./use-auth-state.md) — log in once, reuse session via Playwright `storageState`
-   [`mock-network.md`](./mock-network.md) — intercept HTTP with `page.route()` for edge-case coverage
-   [`manage-test-data.md`](./manage-test-data.md) — factories + auto-cleanup fixture for isolated state

### Cross-cutting workflows
Use throughout the framework, not tied to one artifact type.

-   [`use-helper-functions.md`](./use-helper-functions.md) — `DateTimeHelper`, `DataGenerator`, `ExcelHelper`, etc.
-   [`work-with-email.md`](./work-with-email.md) — email verification flows using `Mail` and `MailSubjects`

## Typical flow

```
explore-screens  →  create-page-object  →  write-e2e-test
                          ↑
                   create-custom-element   (when the screen needs a primitive that doesn't exist yet)

create-api-service  →  write-api-test

Setup once per suite:  use-auth-state              (fast, deterministic login)
Per-test, as needed:   manage-test-data            (factories + cleanup)
                       mock-network                (control backend responses)
                       use-helper-functions        (date, random data, excel)
                       work-with-email             (verification emails)
```

## Conventions

-   **Skill vs guidance** — a skill is a _step-by-step recipe_ for building or testing something. Conceptual background and pattern explanations live in [`../../docs/guidance/`](../../docs/guidance/).
-   **Fixtures** — every test must import `test` and `expect` from `@fixtures/fixtures`. See [ADR-002](../../docs/decisions/ADR-002-custom-fixtures.md).
-   **Path aliases** — always prefer `@pages/*`, `@elements/*`, etc. over relative imports.
-   **Naming** — skills use `verb-noun.md`. Names are stable so users can invoke them by slash command without surprises.
