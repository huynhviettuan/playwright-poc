# Skill: Mock Network Requests

## When to Use

Use this skill when a test needs to **control the backend response** rather than depend on the real API. Typical
reasons:

-   **Edge cases** the real backend can't produce on demand (`500`, `429`, empty list, malformed payload, 10-second
    latency)
-   **Stability** — your test must not break when the backend changes data underneath it
-   **Speed** — bypass slow downstream calls when you only care about UI behavior
-   **Coverage of UI states** — loading, error, empty, pagination — without orchestrating backend state

**Do NOT mock when** the test's purpose is to verify the real integration. Reach for mocking for _UI behavior_ tests;
keep real-API tests for _integration_ coverage.

## Critical Rules

### ✅ Mock at the boundary, assert at the UI

-   Intercept HTTP at `page.route()`. Assert what the user sees, not which mock matched.

### ✅ Mock per-test, not globally

-   Set up mocks in the test (or a fixture scoped to the spec). Cross-test mocks cause spooky failures.

### ✅ Keep mock fixtures small and named

-   Each mock fixture file should describe a scenario (`empty-users.json`, `users-500.json`).
-   Store under `src/data/mocks/<feature>/`.

### ✅ Type your mock payloads

-   Reuse the same TypeScript interfaces from `@models/*` that the real services use. A mock that diverges from
    production types is worse than no mock.

### ✅ Don't mock what you're testing

-   If the test asserts that a request was sent with the right body, mock the **response** only and inspect the
    **request** via `route.request()`.

## Pattern 1: Inline Mock for a Single Test

```ts
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';
import { BrowserInstance } from '@common/browser';

test('should show empty state when no users exist', async ({ usersPage }) => {
    // Arrange — intercept BEFORE navigation
    await BrowserInstance.currentPage.route(`**${Endpoints.api.users}`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [], total: 0 })
        });
    });

    // Act
    await BrowserInstance.currentPage.goto(Endpoints.app.users);

    // Assert
    await expect(usersPage.main.lblEmptyState).toBeVisible();
    await expect(usersPage.main.tblUsers).toBeHidden();
});
```

## Pattern 2: Reusable Mock Helper

Extract repeated mocks into a helper class so specs stay readable.

`src/helpers/network-mock.helper.ts`:

```ts
import { BrowserInstance } from '@common/browser';
import { Route } from '@playwright/test';

type MockResponse<T> = {
    status?: number;
    body?: T;
    delay?: number;
};

export class NetworkMock {
    static async fulfill<T>(urlPattern: string | RegExp, response: MockResponse<T>): Promise<void> {
        await BrowserInstance.currentPage.route(urlPattern, async (route: Route) => {
            if (response.delay) await new Promise((r) => setTimeout(r, response.delay));
            await route.fulfill({
                status: response.status ?? 200,
                contentType: 'application/json',
                body: JSON.stringify(response.body ?? {})
            });
        });
    }

    static async abort(urlPattern: string | RegExp, errorCode: string = 'failed'): Promise<void> {
        await BrowserInstance.currentPage.route(urlPattern, (route) => route.abort(errorCode));
    }

    static async passthrough(urlPattern: string | RegExp): Promise<void> {
        await BrowserInstance.currentPage.unroute(urlPattern);
    }
}
```

Usage:

```ts
import { NetworkMock } from '@helpers/network-mock.helper';

test('should show server error toast on 500', async ({ usersPage, notification }) => {
    await NetworkMock.fulfill(`**${Endpoints.api.users}`, { status: 500 });

    await BrowserInstance.currentPage.goto(Endpoints.app.users);

    expect(await notification.getMessage()).toContain(NotificationMessages.general.serverError);
});

test('should show loading skeleton until data arrives', async ({ usersPage }) => {
    await NetworkMock.fulfill(`**${Endpoints.api.users}`, {
        body: { data: [], total: 0 },
        delay: 1500
    });

    await BrowserInstance.currentPage.goto(Endpoints.app.users);
    await expect(usersPage.main.skeleton).toBeVisible();
});
```

## Pattern 3: Mock Fixtures (JSON files)

For larger payloads, store JSON under `src/data/mocks/<feature>/<scenario>.json`:

```text
src/data/mocks/
└── users/
    ├── ten-users.json
    ├── empty.json
    └── malformed.json
```

Load in tests:

```ts
import usersFixture from '@data/mocks/users/ten-users.json';
import { Users } from '@models/users.interface';

await NetworkMock.fulfill<Users>(`**${Endpoints.api.users}`, { body: usersFixture });
```

(Add a path alias `@data/*` → `src/data/*` in `tsconfig.json` if not already present.)

## Pattern 4: Assert on Outgoing Requests

When the test cares that the UI sent the _right_ request:

```ts
test('should send normalized email on submit', async ({ signUpPage }) => {
    let capturedBody: { email: string } | null = null;

    await BrowserInstance.currentPage.route(`**${Endpoints.api.users}`, async (route) => {
        capturedBody = route.request().postDataJSON();
        await route.fulfill({ status: 201, body: JSON.stringify({ id: '1' }) });
    });

    await signUpPage.signUp('  USER@Example.COM  ');

    expect(capturedBody?.email).toBe('user@example.com');
});
```

## Pattern 5: Conditional Mocking (Mock Some, Pass Through Others)

```ts
await BrowserInstance.currentPage.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/users')) {
        await route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
    } else {
        await route.continue(); // hit the real backend
    }
});
```

## Anti-Patterns

### ❌ Mocking the whole API surface

If you're stubbing 30 endpoints to run one test, you're testing the mocks, not the app. Either narrow the test or switch
to a real-backend integration test.

### ❌ Hardcoded payloads inline in tests

```ts
// Bad — repeats in 12 tests, brittle to schema changes
await route.fulfill({ body: JSON.stringify({ data: [{ id: 1, name: 'X', email: '...' }] }) });
```

Extract to a typed JSON fixture under `src/data/mocks/`.

### ❌ Mocking in `beforeAll`

Mocks are per-page; `beforeAll` may run before any page exists, or the mock will leak between tests. Use `beforeEach` or
inline.

### ❌ Asserting the mock was called

```ts
// Avoid — couples the test to the mock harness
expect(routeWasCalled).toBe(true);
```

Assert what the user sees. If you care that a specific request fired, use Pattern 4.

## Related

-   [Custom Expect Matchers](../../docs/guidance/expect.md)
-   Playwright docs: [Network](https://playwright.dev/docs/network), [Mock APIs](https://playwright.dev/docs/mock)
