# Behavior-Style Testing (test.step + typed DSL)

Behavior-style testing makes E2E specs read as `Given` / `When` / `Then` behavior — readable by BA/PO for sign-off —
**without** a separate Gherkin layer. It uses Playwright's built-in
[`test.step()`](https://playwright.dev/docs/api/class-test#test-step) wrapped in a tiny typed DSL. The step titles
render in the HTML report and trace, which _is_ the sign-off artifact.

This is the **recommended default** for behavior-driven scenarios in this framework. Use Gherkin ([bdd.md](./bdd.md))
only in the narrower case where non-technical stakeholders actually **author** `.feature` files.

## Why this over Gherkin / playwright-bdd

| Concern                   | Behavior DSL (`test.step`)        | Gherkin (`playwright-bdd`)            |
| ------------------------- | --------------------------------- | ------------------------------------- |
| New dependency            | None — built into Playwright      | `playwright-bdd` + `bddgen`           |
| Build / compile step      | None                              | `.feature` → generated specs          |
| Type safety               | Full — plain TS, IDE autocomplete | Step text matched by regex, untyped   |
| Refactor safety           | Rename = compiler catches it      | Rename step text → silent mismatch    |
| Indirection               | One file: title + body together   | feature → step registry → page object |
| Sign-off artifact         | HTML report step tree             | HTML report (after compile)           |
| Stakeholder **authoring** | ❌ not for non-technical authors  | ✅ the one case where Gherkin wins    |

Since BA/PO **read for sign-off but don't author**, the DSL gives the same readable output with far less machinery.

## The DSL

A ~12-line helper wraps `test.step()` with `Given/When/And/Then` prefixes. When implemented it lives at
`src/behavior/bdd.ts` (alias `@behavior/bdd`):

```ts
import { test } from '@fixtures/fixtures';

export const given = (desc: string, body: () => Promise<void>) => test.step(`Given ${desc}`, body);
export const when = (desc: string, body: () => Promise<void>) => test.step(`When ${desc}`, body);
export const and = (desc: string, body: () => Promise<void>) => test.step(`And ${desc}`, body);
export const then = (desc: string, body: () => Promise<void>) => test.step(`Then ${desc}`, body);
```

That's the whole layer. No registry, no codegen.

## Writing a behavior spec

A behavior spec is a normal Playwright spec — same fixtures, same page objects — narrated with the DSL:

```ts
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

The same non-negotiables as [write-e2e-test](../../.claude/skills/write-e2e-test.md) apply: import `test`/`expect` from
`@fixtures/fixtures`, keep logic in page objects, no page-global locators. Step bodies are **glue** that delegate to
page objects — exactly like a plain E2E test, just narrated.

## Sign-off artifact

Run with the HTML reporter; each test expands into its `Given/When/Then` step tree:

```
✓ Successful sign in @AC-SIGNIN-1
    Given the user is on the sign-in page
    When the user signs in with valid credentials
    Then a success notification is shown
    And the dashboard is visible
```

BA/PO open the report and read the behavior per test — no Gherkin, no extra export step. The same titles appear in the
Playwright trace viewer.

## Traceability to acceptance criteria

Tag tests with the acceptance-criteria ID from the user story (`docs/user-stories/`):

```ts
test('Successful sign in @AC-SIGNIN-1', async ({ ... }) => { ... });
```

Filter a run to one AC (or a feature) with grep:

```bash
npx playwright test --grep @AC-SIGNIN-1
```

This links each scenario back to a signed-off requirement without a separate mapping file.

## Scaling: reusable behavior vocabulary

When the same flow recurs across specs (login, navigation, table assertions), promote it to a typed `Behaviors` helper
instead of copy-pasting step bodies. This is the type-safe equivalent of a Gherkin shared-step registry — with
autocomplete and refactor safety, and no string matching:

```ts
// src/behavior/behaviors/auth.behavior.ts
import { Endpoints } from '@constants/endpoints.constant';
import { BrowserInstance } from '@common/browser';
import { given, when } from '@behavior/bdd';

export const authBehaviors = {
    onSignInPage: () =>
        given('the user is on the sign-in page', async () => {
            await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
        }),

    signsIn: (signInPage: SignInPage, email: string) =>
        when(`the user signs in as "${email}"`, async () => {
            await signInPage.signIn(email);
        })
};
```

Specs then compose `await authBehaviors.onSignInPage()` — discoverable via IDE, broken references caught at compile.

## When to Use

-   A feature has business-facing acceptance criteria BA/PO want to **read** for sign-off
-   Scenarios trace back to user stories / AC IDs
-   You want living documentation in the report without a Gherkin toolchain

## When NOT to Use

-   Pure API contract / schema tests — keep as plain [write-api-test](../../.claude/skills/write-api-test.md)
-   Low-level technical edge cases with no business meaning (regex validation, retry timing) — plain E2E spec
-   Non-technical stakeholders genuinely **author** scenarios themselves → use Gherkin ([bdd.md](./bdd.md))

## Future Enhancements

-   **`src/behavior/bdd.ts` + alias** — add the DSL file and the `@behavior/*` path alias to `tsconfig.json` when first
    implemented.
-   **Living-doc reporter** — an optional custom reporter that exports a markdown summary from step titles for offline
    sign-off, if the HTML report isn't sufficient.

## Related

-   [BDD with Gherkin (conditional option)](./bdd.md) — use only when stakeholders author `.feature` files
-   [Write a Behavior Test](../../.claude/skills/write-behavior-test.md) — step-by-step recipe
-   [Write an E2E Test](../../.claude/skills/write-e2e-test.md) — the underlying patterns step bodies must follow
-   [Generate Test Cases](../../.claude/skills/generate-test-cases.md) — user story → scenarios feed behavior specs
-   [Custom Fixtures (ADR-002)](../decisions/ADR-002-custom-fixtures.md) — why specs import from `@fixtures/fixtures`
