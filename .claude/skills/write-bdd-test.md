# Skill: Write a BDD Test

## When to Use

> ⚠️ **Conditional option.** Reach for Gherkin **only when non-technical stakeholders author `.feature` files
> themselves.** If BA/PO only _read_ scenarios for sign-off, use [`write-behavior-test.md`](./write-behavior-test.md)
> instead — same `Given/When/Then` output, no compile step, type-safe.

Use this skill when writing behavior-driven tests in Gherkin (`.feature` files) that compile to Playwright specs via
`playwright-bdd`. Reach for it when stakeholders author features and trace to a user story.

## When NOT to Use

| Situation                                  | Use instead              |
| ------------------------------------------ | ------------------------ |
| Standard E2E test, no Gherkin needed       | `write-e2e-test.md`      |
| API contract / schema test                 | `write-api-test.md`      |
| Building the page object steps delegate to | `create-page-object.md`  |
| Turning a user story into scenarios first  | `generate-test-cases.md` |

> Read [`docs/guidance/bdd.md`](../../docs/guidance/bdd.md) first — it explains _why_ `playwright-bdd` and the
> three-layer model. This skill is the _how_.

## Non-Negotiable Rules

-   **Steps import from `@fixtures/fixtures`** — never `playwright-bdd`'s bare test or `@playwright/test`.
-   **Steps contain glue only** — delegate to page objects; no raw locators, no business logic in step bodies.
-   **Feature files contain business language only** — no selectors, no code, no testids.
-   **Generated specs are git-ignored** — never edit `.features-gen/`; edit the `.feature` or `.steps.ts` source.

## One-Time Setup

### 1. Install

```bash
npm install -D playwright-bdd
```

### 2. Create the BDD config

```ts
// playwright.bdd.config.ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
    features: 'tests/bdd/features/**/*.feature',
    steps: 'tests/bdd/steps/**/*.steps.ts',
    outputDir: '.features-gen'
});

export default defineConfig({
    testDir
    // reuse your existing settings (reporters, use, projects) here
});
```

### 3. Ignore generated specs

Add to `.gitignore`:

```
.features-gen/
```

### 4. Add npm scripts

```json
{
    "scripts": {
        "bdd:gen": "bddgen --config playwright.bdd.config.ts",
        "test:bdd": "bddgen --config playwright.bdd.config.ts && npx playwright test --config playwright.bdd.config.ts"
    }
}
```

### 5. Directory layout

```
tests/bdd/
├── features/
│   └── sign-in.feature        # Gherkin scenarios
└── steps/
    ├── common.steps.ts        # shared steps (navigation, notifications)
    └── sign-in.steps.ts       # feature-specific steps
```

## Authoring Workflow

```
1. Source     → start from a user story / test case (docs/user-stories, docs/test-cases)
2. Feature    → write the .feature in business language
3. Steps      → implement step defs that delegate to page objects
4. Generate   → npm run bdd:gen  (compiles features → specs)
5. Run        → npm run test:bdd
```

## Step 1: Write the Feature File

```gherkin
# tests/bdd/features/sign-in.feature
Feature: Sign In

  Background:
    Given the user is on the sign-in page

  Scenario: Successful sign in with valid credentials
    When the user signs in as "admin@example.com"
    Then a success notification is shown
    And the dashboard is visible

  Scenario Outline: Sign in is rejected for invalid input
    When the user signs in as "<email>"
    Then an error notification "<message>" is shown

    Examples:
      | email             | message                    |
      | bad-format        | Please enter a valid email |
      | unknown@test.com  | Invalid credentials        |
```

-   Use **`Background`** for repeated `Given` setup.
-   Use **`Scenario Outline` + `Examples`** for data-driven variants — don't copy-paste scenarios.
-   Keep each step a single business intent so it stays reusable.

## Step 2: Implement Step Definitions

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

Then('an error notification {string} is shown', async ({ notification }, message: string) => {
    expect(await notification.getMessage()).toEqual(message);
});

Then('the dashboard is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.main.lblTitle).toBeVisible();
});
```

Key points:

-   `createBdd(test)` is fed the **custom** `test` from `@fixtures/fixtures`, so steps receive every page object,
    service, and the `notification` fixture as destructured arguments.
-   Gherkin parameters (`{string}`, `{int}`) arrive as the trailing args after the fixtures object.
-   The step body delegates to `signInPage.signIn(...)` — the same method a plain E2E test would call.

## Step 3: Extract Shared Steps

Move steps used across features into `common.steps.ts` so features compose them:

```ts
// tests/bdd/steps/common.steps.ts
import { createBdd } from 'playwright-bdd';

import { expect, test } from '@fixtures/fixtures';

const { Then } = createBdd(test);

Then('a success notification is shown', async ({ notification }) => {
    expect(await notification.isSuccess()).toBeTruthy();
});
```

Define each step text **once** across the whole steps directory — duplicate step text causes a compile error.

## Step 4: Generate and Run

```bash
npm run bdd:gen     # compile .feature → .features-gen/**/*.spec.ts
npm run test:bdd    # generate + run on the Playwright runner
```

Tags work like Playwright grep:

```gherkin
@smoke
Scenario: Successful sign in with valid credentials
```

```bash
npx playwright test --config playwright.bdd.config.ts --grep @smoke
```

## Checklist

-   [ ] `playwright-bdd` installed
-   [ ] `playwright.bdd.config.ts` created with `defineBddConfig`
-   [ ] `.features-gen/` added to `.gitignore`
-   [ ] `bdd:gen` / `test:bdd` scripts added
-   [ ] Feature file uses business language only (no selectors/code)
-   [ ] Steps import `test`/`expect` from `@fixtures/fixtures`
-   [ ] Step bodies delegate to page objects (no raw locators/logic)
-   [ ] Shared steps extracted to `common.steps.ts`, no duplicate step text
-   [ ] `Background` / `Scenario Outline` used to avoid repetition

## Related

-   [BDD Guidance](../../docs/guidance/bdd.md) — concepts, layer model, tool choice
-   [`write-e2e-test.md`](./write-e2e-test.md) — the patterns step bodies must follow
-   [`generate-test-cases.md`](./generate-test-cases.md) — produce scenarios from a user story
-   [`create-page-object.md`](./create-page-object.md) — the page objects steps delegate to
