# Skill: Write E2E Test

## When to Use

Use this skill when creating a new E2E test case.

## Critical Rules

### ✅ ALWAYS Use Custom Fixtures

```ts
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER: import { expect, test } from '@playwright/test';
```

### ✅ Follow SOLID Principles

-   Keep test logic in page objects, not in test files
-   Each page object should have a single responsibility
-   Use composition over inheritance for complex behaviors

### ✅ Clean Code Practices

-   Use descriptive test names that explain the behavior
-   Follow Arrange-Act-Assert pattern
-   Keep tests focused and independent
-   Extract complex logic into helper methods
-   Use named constants instead of magic values

## Instructions

1. **Create test file** in `tests/e2e/[feature]/[test-name].spec.ts`:

    ```ts
    import { BrowserInstance } from '@common/browser';
    import { Endpoints } from '@constants/endpoints.constant';
    import { NotificationMessages } from '@constants/messages.constant';
    import { expect, test } from '@fixtures/fixtures';

    test.describe('[Feature Name]', () => {
        test.beforeEach(async () => {
            await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
        });

        test('[Test description]', async ({ signInPage, notification }) => {
            // Arrange
            const email = 'test@example.com';

            // Act
            await signInPage.signIn(email);

            // Assert
            await expect(signInPage.main.txtEmail).toBeVisible();
            await expect(signInPage.main.btnLogin).toBeEnabled();
            expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
        });
    });
    ```

2. **Use fixtures** from `@fixtures/fixtures`:

    - Page objects: `{ signInPage, dashboardPage, ... }`
    - Services: `{ tokensService, userService, ... }`
    - Commands: Custom test commands

3. **Navigation** via BrowserInstance:

    ```ts
    await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
    ```

4. **Assertions** using custom expect:

    ```ts
    // ✅ Custom element assertions - no `.element` needed
    await expect(signInPage.main.txtEmail).toBeVisible();
    await expect(signInPage.main.btnLogin).toBeEnabled();
    await expect(signInPage.header.lblTitle).toHaveText('Sign In');
    await expect(signInPage.main.lblError).toContainText('Invalid');

    // ✅ Regular value assertions still work
    expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
    ```

5. **Messages** using constants:

    ```ts
    import { NotificationMessages } from '@constants/messages.constant';

    expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
    expect(await notification.getMessage()).toEqual(NotificationMessages.payment.success);
    ```

## Test Structure Best Practices

-   Use **describe blocks** to group related tests
-   Use **beforeEach** for setup (navigation, login)
-   Use **afterEach** for cleanup if needed
-   Keep tests **focused and independent**
-   Use **page object methods** instead of direct element interaction
-   Use **meaningful test descriptions**
-   Follow **Arrange-Act-Assert** pattern

## Common Patterns

### Wait for Element

```ts
import { ElementStateEnum } from '@enums/element.enum';
await element.waitFor({ state: ElementStateEnum.VISIBLE });
```

### Wait for a Network Response (race-free navigation / data capture)

When a UI action triggers a request and the next assertion depends on the response
(redirect target, returned id, refreshed data), gate the assertion on the network —
not a timer. Set up the wait **before** the action using `Promise.all`:

```ts
import { ResponseHelper } from '@helpers/helper-functions';

const [response] = await Promise.all([
    ResponseHelper.waitFor('/user-organization/auth/signin'),
    signInPage.main.btnLogin.click()
]);

expect(response.status()).toBe(200);

// Read data from the response for the next step
const body = await ResponseHelper.interceptedToJson<SignInResponse>(response);
expect(body.token).toBeTruthy();
```

See [`use-helper-functions.md`](./use-helper-functions.md#responsehelperwaitfor--synchronize-on-a-network-response) for the four patterns (gate assertion, capture data, refresh-after-action, negative path) and when **not** to use `waitFor`.

### Multiple Assertions

```ts
await Promise.all([
    expect(await element1.isVisible()).toBeTruthy(),
    expect(await element2.getTextContent()).toEqual('text')
]);
```

### File Upload & Drop

```ts
// Traditional upload (input[type="file"])
await page.main.txtFile.uploadFile('data.xlsx');

// Drag-and-drop onto upload zone
await page.main.dropZone.dropFile('document.pdf');

// Drop text/clipboard data
await page.main.dropZone.dropData({ 'text/plain': 'pasted content' });
```

### Generate Test Data

```ts
import { DataGenerator } from '@helpers/generate-data-functions';
const email = DataGenerator.randomEmail('test');
const name = DataGenerator.randomName();
```

## Related Documentation

- `docs/guidance/expect.md` - Custom assertions for Button, Input, Label, etc.
- `docs/guidance/messages.md` - Centralized notification and validation messages
- `docs/guidance/notifications.md` - Shared notification fixture and component
- `.claude/skills/create-page-object.md` - Container-based page object pattern
