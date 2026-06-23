# Skill: Refactor Legacy Code to Follow Skills

## When to Use

Use this skill when **migrating an existing automation project** (or legacy code within this repo) to align with the
patterns documented in `.claude/skills/`. The code works but was written before the skills existed — it uses raw
Playwright calls, flat page objects, inline locators, co-located types, and ad-hoc test data.

This skill is a **systematic checklist** of every convention the skills enforce, organized by artifact type. Work
through the sections that apply; skip the rest.

## When NOT to Use

| Situation                           | Use instead                              |
| ----------------------------------- | ---------------------------------------- |
| Writing new code from scratch       | Use the specific creation skill directly |
| Changing behavior while refactoring | Feature first, refactor separately       |
| Code already follows the skills     | Nothing to do                            |

## Prerequisites

Before starting, read [refactor-code.md](./refactor-code.md). That skill defines the **methodology** (goal → safety net
→ smallest steps → verify). This skill defines the **target state** — what "follows the skills" actually means,
violation by violation.

## Refactoring Checklist

Work through each section. For every violation found: fix it, type-check, run affected tests, commit.

---

### 1. Imports — Custom Fixtures (`write-e2e-test`, `write-api-test`)

**Violation:** `import { test, expect } from '@playwright/test'`

**Fix:** Replace with `import { expect, test } from '@fixtures/fixtures'` everywhere.

```ts
// ❌ Legacy
import { test, expect } from '@playwright/test';

// ✅ Correct
import { expect, test } from '@fixtures/fixtures';
```

**Search:** `grep -r "from '@playwright/test'" tests/`

---

### 2. Page Objects — Container-Based Architecture (`create-page-object`)

**Violation:** Flat page object files (`sign-in.page.ts`) with all elements at class root, no containers, no `Form`
component usage.

**Fix per page:**

1. Create container folder: `src/components/containers/<page-name>/`
2. Split into `header.container.ts`, `main.container.ts`, `footer.container.ts`
3. Move elements into the correct container, scoped under `this.container`
4. Create page object at `src/pages/<page-name>/index.ts` that composes containers
5. Register in `src/fixtures/page-fixtures.ts`
6. Update all test imports

**Key rules to enforce:**

| Rule             | What to check                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Parent scoping   | Every element resolves through a parent `Locator`, never page-global `$getByTestId(...)`                                |
| `Form` component | Containers with form elements use `new Form(this.container)` + `form.getInput()` / `form.getButton()`                   |
| Folder structure | Page object is `src/pages/<name>/index.ts`, not `src/pages/<name>.page.ts`                                              |
| Naming           | Containers: `[PageName][Section]Container`. Elements: `btn`, `txt`, `lbl`, `lnk`, `chk`, `drp`, `tbl` prefixes          |
| Section pattern  | Dynamic/repeated sections use factory methods, not singletons (see `create-page-object.md` § Multiple Dynamic Sections) |
| Skeleton         | Containers with loading states expose `Skeleton` element + `waitForLoad()`                                              |

---

### 3. Custom Elements (`create-custom-element`)

**Violation:** Raw `Locator` used directly instead of typed element classes, or complex element classes with mixed
concerns.

**Fix:**

1. Identify inline `page.locator(...)` / `page.getByRole(...)` calls that should be typed elements
2. Replace with `Button`, `Input`, `Label`, `Link`, `Checkbox`, `Dropdown`, etc.
3. For complex elements: extract helper classes (composition), keep constructors clean
4. Extend the correct base: `BaseControl` (read-only), `Clickable` (click), `Editable` (input)

---

### 4. API Services (`create-api-service`)

**Violation:** Types co-located with service classes. Services not extending `BaseService`. Raw
`request.get()`/`request.post()` instead of inherited methods. Token passed per-method instead of `setToken()`.

**Fix:**

1. Move types to `src/models/<module>/<module>.interface.ts`
2. Ensure service extends `BaseService`
3. Replace raw HTTP calls with `this.send<T>(method, args)` returning `ServiceResponse<T>`
4. Use concrete typed interfaces for request bodies, not `any` or untyped objects
5. Use controller pattern method names: `getAll()`, `getById(id)`, `create(body)`, `deleteById(id)`
6. Replace `token` method parameter with `service.setToken(token)` (set once)
7. Use `this.endpoint('/sub-path')` for sub-resource URLs (not `createEndpoint`)
8. Register in `src/fixtures/service-fixtures.ts`

---

### 5. Test Structure (`write-e2e-test`, `write-api-test`)

**Violation:** Tests with inline selectors, no Arrange-Act-Assert, magic values, direct element interaction instead of
page object methods.

**Fix for E2E tests:**

1. All element interaction goes through page objects — no `page.locator(...)` in test files
2. Follow Arrange-Act-Assert pattern
3. Use `NotificationMessages` constants for assertion messages
4. Use `notification` fixture for toast/error messages — no per-page `toast` or `lblError`
5. Navigation via `BrowserInstance.currentPage.goto(Endpoints.xxx)`
6. Use `StatusCodes` enum in API tests, not raw numbers
7. Use `DataGenerator` for test data, never hardcoded values
8. Use `ResponseHelper.waitFor()` for network-dependent assertions

---

### 6. Authentication (`use-auth-state`)

**Violation:** UI login in `beforeEach` for every test. Slow and brittle.

**Fix:**

1. Set up global setup with `storageState` (see `use-auth-state.md`)
2. Remove `beforeEach` login blocks from all non-auth tests
3. Keep UI login only for tests that verify the sign-in flow itself
4. Use API login (`ApiCommands.getAuthorizationToken()`) for setup

---

### 7. Test Data (`manage-test-data`)

**Violation:** Shared test users, hardcoded emails, no cleanup, cleanup in test body (skipped on failure).

**Fix:**

1. Replace hardcoded emails with `DataGenerator.randomEmail('feature-name')`
2. Move cleanup to `test.afterEach` or auto-cleanup fixtures
3. Extract repeated entity creation into factory classes under `src/helpers/factories/`
4. For frequently used factories, create auto-cleanup fixtures in `src/fixtures/data-fixtures.ts`
5. Ensure cleanup is idempotent (swallow 404s)

---

### 8. Network Mocking (`mock-network`)

**Violation:** Inline mocks with hardcoded JSON, mocks in `beforeAll`, untyped payloads.

**Fix:**

1. Extract mock payloads to `src/data/mocks/<feature>/<scenario>.json`
2. Type payloads with interfaces from `@models/*`
3. Move mocks to per-test or `beforeEach`, never `beforeAll`
4. Use `NetworkMock` helper class for repeated patterns

---

### 9. Email Testing (`work-with-email`)

**Violation:** Custom mail classes per email type, hardcoded subjects, no cleanup.

**Fix:**

1. Use `Mail` class directly — no `BaseMail` or per-type mail classes
2. Use `MailSubjects` constants for all subjects
3. Add `mail.deleteMailByUser()` or `mail.deleteAllMails()` in `afterEach`
4. Always call `mail.waitForMail()` before reading content

---

### 10. Path Aliases

**Violation:** Relative imports (`../../src/pages/sign-in`).

**Fix:** Replace all relative imports with path aliases (`@pages/sign-in`, `@elements/*`, etc.).

**Search:** `grep -rn "from '\.\." src/ tests/`

---

### 11. Constants & Configuration

**Violation:** Magic strings/numbers, hardcoded URLs, inline endpoint paths.

**Fix:**

1. URLs → `Config.app.baseUrl`, `Config.api.domain`
2. Endpoints → `Endpoints.auth.signIn`, `Endpoints.api.users`
3. Timeouts → `Timeouts.long`
4. Messages → `NotificationMessages.*` or `MailSubjects.*`
5. Dates → `DateFormats.*`

---

### 12. Helper Functions (`use-helper-functions`)

**Violation:** Inline date formatting, manual random data generation, raw file operations.

**Fix:** Replace with existing helpers:

| Inline pattern                | Replace with                                                |
| ----------------------------- | ----------------------------------------------------------- |
| Manual date math              | `DateTimeHelper.today()`, `DateTimeHelper.addDays(n)`       |
| `Math.random()` for test data | `DataGenerator.randomEmail()`, `DataGenerator.randomName()` |
| Raw Excel parsing             | `ExcelHelper.open(...).getRowAsJson(n)`                     |
| Inline array operations       | `ArrayHelper.*`                                             |
| Inline string operations      | `StringHelper.*`                                            |
| Response JSON parsing         | `ResponseHelper.toJson<T>(response)`                        |

---

## Execution Order

Refactor in this order to minimize rework:

1. **Imports & path aliases** (§1, §10) — mechanical, low risk, unblocks everything
2. **Constants** (§11) — removes magic values before touching structure
3. **Custom elements** (§3) — elements must exist before containers reference them
4. **Containers & page objects** (§2) — largest structural change
5. **API services** (§4) — move types, extend BaseService
6. **Fixtures registration** — wire up new page objects, services, factories
7. **Test structure** (§5) — update tests to use new page objects and fixtures
8. **Auth state** (§6) — remove UI login boilerplate
9. **Test data** (§7) — factories and cleanup
10. **Network mocking** (§8) — extract and type mock payloads
11. **Email** (§9) — standardize mail usage
12. **Helpers** (§12) — replace inline utilities

Commit after each section. Type-check and run affected tests between sections.

## Verification

After completing all applicable sections:

-   [ ] `npx tsc --noEmit` — zero errors
-   [ ] Lint passes
-   [ ] All existing tests pass with no expectation changes
-   [ ] No `import ... from '@playwright/test'` in test files
-   [ ] No relative imports in `src/` or `tests/`
-   [ ] No page-global `$getByTestId(...)` without parent scoping
-   [ ] No types co-located with service classes
-   [ ] No hardcoded test emails or magic values
-   [ ] No UI login in non-auth test `beforeEach`
-   [ ] No cleanup in test body (must be in `afterEach` or fixture teardown)

## Related

-   [refactor-code.md](./refactor-code.md) — the refactoring methodology (goal → safety net → steps → verify)
-   [create-page-object.md](./create-page-object.md) — container-based page object pattern
-   [create-custom-element.md](./create-custom-element.md) — typed element classes
-   [create-api-service.md](./create-api-service.md) — service + types in `@models/`
-   [write-e2e-test.md](./write-e2e-test.md) — E2E test conventions
-   [write-api-test.md](./write-api-test.md) — API test conventions
-   [use-auth-state.md](./use-auth-state.md) — session reuse
-   [manage-test-data.md](./manage-test-data.md) — factories + cleanup
-   [mock-network.md](./mock-network.md) — typed network mocks
-   [work-with-email.md](./work-with-email.md) — email testing
