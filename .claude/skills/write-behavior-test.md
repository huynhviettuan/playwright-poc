# Skill: Write a Behavior Test

## When to Use

Use this skill when writing behavior-driven E2E tests narrated as `Given` / `When` / `Then` using Playwright's built-in
`test.step()` wrapped in a typed DSL. This is the **recommended default** when a feature has business-facing acceptance
criteria that BA/PO read for sign-off.

## When NOT to Use

| Situation                                     | Use instead                          |
| --------------------------------------------- | ------------------------------------ |
| Plain E2E test, no behavior narration needed  | `write-e2e-test.md`                  |
| API contract / schema test                    | `write-api-test.md`                  |
| Stakeholders **author** `.feature` files      | `write-bdd-test.md` (Gherkin)        |
| Turning a user story into scenarios first      | `generate-test-cases.md`            |

> Read [`docs/guidance/behavior-testing.md`](../../docs/guidance/behavior-testing.md) first — it explains *why* this
> over Gherkin and the sign-off model. This skill is the *how*.

## Non-Negotiable Rules

- **Import from `@fixtures/fixtures`** — never `@playwright/test`.
- **Step bodies are glue only** — delegate to page objects; no raw locators, no business logic inside `given/when/then`.
- **One assertion intent per `then`** — keeps the report readable and each step meaningful.
- **Tag with the AC ID** — `@AC-<id>` in the test title links to the acceptance criterion in `docs/user-stories/`.

## One-Time Setup

### 1. Add the DSL helper

```ts
// src/behavior/bdd.ts
import { test } from '@fixtures/fixtures';

export const given = (desc: string, body: () => Promise<void>) => test.step(`Given ${desc}`, body);
export const when = (desc: string, body: () => Promise<void>) => test.step(`When ${desc}`, body);
export const and = (desc: string, body: () => Promise<void>) => test.step(`And ${desc}`, body);
export const then = (desc: string, body: () => Promise<void>) => test.step(`Then ${desc}`, body);
```

### 2. Add the path alias

In `tsconfig.json`:

```json
{
    "compilerOptions": {
        "paths": {
            "@behavior/*": ["src/behavior/*"]
        }
    }
}
```

No new npm dependency — `test.step` is built into Playwright.

## Authoring Workflow

```
1. Source     → start from a user story / test case (docs/user-stories, docs/test-cases)
2. Narrate    → write the spec with given/when/then, tag the AC id
3. Delegate   → each step body calls a page-object method
4. Run        → npx playwright test --grep @AC-<id>
5. Sign off   → BA/PO read the step tree in the HTML report
```

## Step 1: Write the Behavior Spec

```ts
// tests/e2e/auth/sign-in.behavior.spec.ts
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { NotificationMessages } from '@constants/messages.constant';
import { and, given, then, when } from '@behavior/bdd';

import { expect, test } from '@fixtures/fixtures';

test.describe('Sign In', () => {
    test('Successful sign in @AC-SIGNIN-1', async ({ signInPage, notification, dashboardPage }) => {
        await given('the user is on the sign-in page', async () => {
            await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
        });

        await when('the user signs in with valid credentials', async () => {
            await signInPage.signIn('admin@example.com');
        });

        await then('a success notification is shown', async () => {
            expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
        });

        await and('the dashboard is visible', async () => {
            await expect(dashboardPage.main.lblTitle).toBeVisible();
        });
    });
});
```

Each `given/when/then` body delegates to a page object — the same call a plain E2E test would make, just narrated.

## Step 2: Extract Reusable Behaviors (when a flow repeats)

When the same flow appears across specs, promote it to a typed helper instead of copy-pasting:

```ts
// src/behavior/behaviors/auth.behavior.ts
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { given, when } from '@behavior/bdd';

export const authBehaviors = {
    onSignInPage: () =>
        given('the user is on the sign-in page', async () => {
            await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
        }),

    signsIn: (signInPage: SignInPage, email: string) =>
        when(`the user signs in as "${email}"`, async () => {
            await signInPage.signIn(email);
        }),
};
```

Specs compose them: `await authBehaviors.onSignInPage();`. Unlike a Gherkin step registry, references are typed and
refactor-safe — a rename is caught by the compiler, not silently mismatched.

## Step 3: Run and Sign Off

```bash
# Run one acceptance criterion
npx playwright test --grep @AC-SIGNIN-1

# Run the feature and open the report for sign-off
npx playwright test tests/e2e/auth/sign-in.behavior.spec.ts
npx playwright show-report
```

The HTML report expands each test into its `Given/When/Then` tree — that is the artifact BA/PO read.

## Checklist

- [ ] `src/behavior/bdd.ts` DSL helper present
- [ ] `@behavior/*` alias added to `tsconfig.json`
- [ ] Spec imports `test`/`expect` from `@fixtures/fixtures` and DSL from `@behavior/bdd`
- [ ] Each step body delegates to a page object (no raw locators/logic)
- [ ] Test title tagged with `@AC-<id>` linking to the user story
- [ ] Repeated flows extracted to a typed `Behaviors` helper (no copy-paste)
- [ ] Verified the step tree renders in `npx playwright show-report`

## Related

- [Behavior-Style Testing Guidance](../../docs/guidance/behavior-testing.md) — concepts, sign-off model, DSL rationale
- [`write-e2e-test.md`](./write-e2e-test.md) — the patterns step bodies must follow
- [`write-bdd-test.md`](./write-bdd-test.md) — Gherkin alternative, only if stakeholders author features
- [`generate-test-cases.md`](./generate-test-cases.md) — produce scenarios from a user story
- [`create-page-object.md`](./create-page-object.md) — the page objects steps delegate to
