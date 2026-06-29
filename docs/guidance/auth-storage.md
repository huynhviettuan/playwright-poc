# Auth Storage & Mid-Test Role Switching

## How `storageState` Works

Playwright's `storageState` provides per-test authentication without logging in on every test:

1. **Global setup** generates auth files (e.g. `.auth/super-admin.json`) by logging in once via API
2. **`playwright.config.ts`** references the file: `use: { storageState: '.auth/super-admin.json' }`
3. **Each test** gets a **fresh browser context** initialized from that file — already authenticated

The file on disk is read-only during test execution. Clearing cookies mid-test does NOT affect other tests.

## Why `logout()` Doesn't Break Other Tests

```
Test A starts  → fresh context from storageState → authenticated
Test A logout  → clears LIVE context only        → unauthenticated
Test A ends    → context destroyed

Test B starts  → fresh context from storageState → authenticated again ✅
```

Each `test()` block gets its own isolated browser context. Changes within one test never leak to another.

## Fixtures

### `logout()`

Clears the current session, leaving the browser unauthenticated. Use for flows that need an unauthenticated state
mid-test (invite links, signup, password reset).

```ts
import { expect, test } from '@fixtures/fixtures';

test('invited user can sign up', async ({ logout, mail, signUpPage }) => {
    // Starts as super admin (from storageState)
    await adminPage.inviteUser('new@example.com');

    await logout();
    // Browser is now unauthenticated — on sign-in page

    const inviteLink = await mail.getInviteLink('new@example.com');
    await BrowserInstance.currentPage.goto(inviteLink);
    // Now on signup page — complete registration
});
```

### `switchRole(role, options?)`

Clears session and re-authenticates as a different role. Two modes:

| Mode          | Usage                                            | Speed         |
| ------------- | ------------------------------------------------ | ------------- |
| API (default) | `switchRole(Role.StandardUser)`                  | Fast (~100ms) |
| UI            | `switchRole(Role.StandardUser, { useUi: true })` | Slow (~3-8s)  |

Use API mode unless the test specifically needs to verify the login UI flow.

```ts
import { Role } from '@enums/role.enum';
import { expect, test } from '@fixtures/fixtures';

test('standard user cannot edit admin content', async ({ switchRole, itemPage }) => {
    // Starts as super admin
    await itemPage.createItem('Protected Item');

    await switchRole(Role.StandardUser);

    await itemPage.openItem('Protected Item');
    await expect(itemPage.main.btnEdit).toBeHidden();
});
```

### Combining `logout` + `switchRole` in one test

```ts
test('admin invites user, user signs up, admin verifies', async ({ logout, switchRole }) => {
    // Phase 1: Admin invites
    await adminPage.inviteUser(email);

    // Phase 2: Sign up as new user
    await logout();
    const link = await mail.getInviteLink(email);
    await BrowserInstance.currentPage.goto(link);
    await signUpPage.complete();

    // Phase 3: Back to admin to verify
    await switchRole(Role.SuperAdmin);
    await adminPage.verifyUserExists(email);
});
```

## Adding a New Role

1. Add value to `src/enums/role.enum.ts`
2. Add email env var to `src/constants/config.constant.ts` (`Config.auth`)
3. Add mapping in `src/fixtures/role-fixtures.ts` (`ROLE_EMAILS`)
4. Add env var to `.env.example` and your `.env` files

## Token Injection

The `switchRole` fixture injects the token as a cookie named `auth_token`. If your app uses a different mechanism (e.g.
`localStorage` key, different cookie name), update the injection logic in `src/fixtures/role-fixtures.ts`.

## Related

-   [use-auth-state skill](../../.claude/skills/use-auth-state.md) — global setup + storageState configuration
-   [work-with-email skill](../../.claude/skills/work-with-email.md) — extracting invite links from email
-   [notifications guidance](notifications.md) — centralized notification fixture
