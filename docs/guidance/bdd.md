# BDD with Gherkin and playwright-bdd

> ⚠️ **Conditional option.** Use Gherkin **only when non-technical stakeholders actually author `.feature` files
> themselves.** If BA/PO merely _read_ scenarios for sign-off (the common case), prefer
> [Behavior-Style Testing](./behavior-testing.md) — it delivers the same readable `Given/When/Then` output with no
> compile step, no string-matched step registry, and full type safety.

Behavior-Driven Development (BDD) describes test scenarios in plain-language **Gherkin** (`Given` / `When` / `Then`),
making them readable by non-technical stakeholders. This framework uses
[`playwright-bdd`](https://vitalets.github.io/playwright-bdd/) because it compiles `.feature` files into Playwright test
specs — so BDD runs on the **same** Playwright runner and reuses the **same** custom fixtures, page objects, and
services already in this repo.

## Why playwright-bdd (not Cucumber.js)

| Concern                 | playwright-bdd                        | Cucumber.js                           |
| ----------------------- | ------------------------------------- | ------------------------------------- |
| Test runner             | Playwright's own runner               | Separate Cucumber runner              |
| Custom fixtures         | Reuses `@fixtures/fixtures` directly  | Requires a parallel world/hooks setup |
| Parallelism / sharding  | Native Playwright sharding            | Manual config                         |
| Trace / HTML report     | Works out of the box                  | Extra wiring                          |
| Page objects / services | Injected via fixtures, no duplication | Re-instantiated in step world         |

The rule: **BDD is a presentation layer over the existing architecture, not a replacement for it.** Steps delegate to
page objects exactly like a normal E2E test — they never contain raw locators or business logic.

## When to Use BDD

-   The feature has **business-facing acceptance criteria** stakeholders want to read or sign off on
-   Test cases trace back to **user stories** (`docs/user-stories/`) and AC IDs
-   Scenarios share a **common vocabulary** worth reusing across features (login, navigation, table assertions)

## When NOT to Use BDD

-   Pure **API contract / schema** tests — keep these as plain `write-api-test` specs
-   Low-level **technical edge cases** with no business meaning (regex validation, retry timing)
-   One-off **throwaway** checks — the Gherkin overhead isn't worth it

Mixing is fine: a feature can have `.feature` files for the headline flows and plain `.spec.ts` for the technical edges.

## Architecture

```text
docs/user-stories/sign-in.md         (business acceptance criteria)
        │
        ▼
tests/bdd/features/sign-in.feature   (Gherkin scenarios)
        │  npx bddgen  (compiles)
        ▼
.features-gen/**/*.spec.ts           (generated — git-ignored)
        │
        ▼
tests/bdd/steps/*.steps.ts           (step defs → delegate to page objects)
        │
        ▼
src/pages/**  +  @fixtures/fixtures   (existing architecture, unchanged)
```

## The Three Layers

### 1. Feature file — business language only

```gherkin
# tests/bdd/features/sign-in.feature
Feature: Sign In

  Background:
    Given the user is on the sign-in page

  Scenario: Successful sign in with valid credentials
    When the user signs in as "admin@example.com"
    Then a success notification is shown
    And the dashboard is visible
```

No selectors, no `data-testid`, no code — just intent.

### 2. Step definitions — glue, no logic

Steps receive the **same fixtures** as a normal test and immediately delegate to page objects:

```ts
// tests/bdd/steps/sign-in.steps.ts
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { NotificationMessages } from '@constants/messages.constant';
import { createBdd } from 'playwright-bdd';

import { expect, test } from '@fixtures/fixtures';

const { Given, When, Then } = createBdd(test);

Given('the user is on the sign-in page', async () => {
    await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
});

When('the user signs in as {string}', async ({ signInPage }, email: string) => {
    await signInPage.signIn(email);
});

Then('a success notification is shown', async ({ notification }) => {
    expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
});

Then('the dashboard is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.main.lblTitle).toBeVisible();
});
```

The same non-negotiables from [write-e2e-test](../../.claude/skills/write-e2e-test.md) apply: import `test`/`expect`
from `@fixtures/fixtures`, keep logic in page objects, no page-global locators.

### 3. Page objects / services — unchanged

The existing layer. Steps consume them through fixtures; nothing about page objects changes for BDD.

## Keeping Steps Reusable

-   **One step, one intent.** `When the user signs in as {string}` is reusable;
    `When the user types email and clicks the blue button` is not.
-   **Parameterize with Gherkin types** (`{string}`, `{int}`) instead of hardcoding values.
-   **Group shared steps** (navigation, notifications, table assertions) into `tests/bdd/steps/common.steps.ts` so
    features compose them.
-   **Use `Background`** for repeated `Given` setup instead of copying it into every scenario.
-   **Use `Scenario Outline` + `Examples`** for data-driven variants rather than near-duplicate scenarios.

## Related

-   [Write a BDD Test](../../.claude/skills/write-bdd-test.md) — step-by-step setup and authoring recipe
-   [Write an E2E Test](../../.claude/skills/write-e2e-test.md) — the underlying patterns steps must follow
-   [Generate Test Cases](../../.claude/skills/generate-test-cases.md) — user story → scenarios feed BDD features
-   [Custom Fixtures (ADR-002)](../decisions/ADR-002-custom-fixtures.md) — why steps import from `@fixtures/fixtures`
