# Common Errors & Solutions

## Import Errors

### Error: Cannot import from '@fixtures/fixtures'
```
Cannot find module '@fixtures/fixtures'
```
**Solution:** Import from `@fixtures/fixtures` not `@playwright/test`
```ts
// ✅ Correct
import { test, expect } from '@fixtures/fixtures';

// ❌ Wrong
import { test, expect } from '@playwright/test';
```

### Error: Path alias not working
```
Cannot find module '@pages/sign-in'
```
**Solution:** Ensure `tsconfig.json` has correct `paths` configuration and restart IDE.

## Element Errors

### Error: Element not found
```
Timeout 30000ms exceeded waiting for selector
```
**Solutions:**
1. Wait for element: `await element.waitFor({ state: 'visible' })`
2. Check selector: Use Playwright Inspector
3. Increase timeout: `{ timeout: 60000 }`
4. Check parent locator scope

### Error: Element is not clickable
```
Element is outside of the viewport
```
**Solution:** Scroll into view first
```ts
await element.scrollIntoView();
await element.click();
```

## Test Execution Errors

### Error: Browser not launching
```
Failed to launch browser
```
**Solutions:**
1. Install browsers: `npx playwright install`
2. Check Playwright version matches playwright-core
3. Run: `npx playwright install-deps`

### Error: Fixtures not available
```
Property 'signInPage' does not exist
```
**Solution:** Register page object in `src/fixtures/page-fixtures.ts`

## Container Architecture Errors

### Error: Container not found
```
Cannot find module '@components/containers/sign-in/main.container'
```
**Solution:** Create container structure:
```
src/components/containers/[page-name]/
├── header.container.ts
├── main.container.ts
└── footer.container.ts
```

## Config Errors

### Error: Environment variable undefined
```
Config.auth.password is undefined
```
**Solutions:**
1. Create `.env` file in project root
2. Add variable: `PASSWORD=yourpassword`
3. Ensure dotenv is loaded in `config.constant.ts`

## Flaky Test Patterns

Tests that pass alone but fail in a suite, pass locally but fail in CI, or fail
intermittently are almost always **races** between the test and the app. The patterns
below cover the timing issues we hit most often, with the fix and a link to the
authoritative skill / guidance for each.

### Pattern: Click ignored — element hidden behind skeleton

**Symptom:**
```
Error: locator.click: Timeout exceeded — element is not visible
```
or the click "works" (no error) but the app doesn't respond, because a skeleton
overlay was intercepting the pointer.

**Root cause:** The page is still rendering its skeleton loaders while the test
asserts/clicks. Element is in the DOM but covered or not yet interactive.

**Fix:** Call `waitForPageLoad()` after navigation or after any action that triggers
a data refresh. Page objects with skeletons must expose this — see
[`docs/guidance/skeleton.md`](../guidance/skeleton.md).

```ts
await BrowserInstance.currentPage.goto(Endpoints.app.users);
await usersPage.waitForPageLoad();          // gates on skeletons hidden

await usersPage.main.btnAddUser.click();    // safe — page is interactive
```

If the page object doesn't have `waitForPageLoad` yet, add a `Skeleton` to the
relevant container per the guidance.

---

### Pattern: Assertion races the network response

**Symptom:** Sign-in test passes when stepping through, fails when running fast:
`expect(URL).not.toMatch(/sign-in/)` fires before the redirect.

**Root cause:** The click triggers a request, but the test asserts before the
response arrives.

**Fix:** Gate the assertion on the response, not on a timer. Use
`ResponseHelper.waitFor` with `Promise.all` so the wait registers before the click —
see [`use-helper-functions.md`](../../.claude/skills/use-helper-functions.md#responsehelperwaitfor--synchronize-on-a-network-response).

```ts
const [response] = await Promise.all([
    ResponseHelper.waitFor('/user-organization/auth/signin'),
    signInPage.main.btnLogin.click()
]);

expect(response.status()).toBe(200);
await expect(BrowserInstance.currentPage).not.toHaveURL(/\/sign-in/);
```

---

### Pattern: Notification missed — appears and disappears too fast

**Symptom:**
```ts
expect(await notification.getMessage()).toEqual('Login successful');
// → Received: '' (empty)
```

**Root cause:** Notification auto-dismissed (often 3–5 seconds) before the assertion read it.

**Fix:** `Notification.getMessage()` already calls `waitForVisible()` internally, so
the common case is covered. For an explicit pre-wait (e.g. when asserting against a
specific message), use `waitForMessage`:

```ts
await notification.waitForMessage(NotificationMessages.auth.loginSuccess);
```

If still flaky, the notification may be racing the next page navigation — combine
with `ResponseHelper.waitFor` so you assert before the app moves on.

---

### Pattern: Strict mode violation — multiple elements match

**Symptom:**
```
Error: strict mode violation: locator(...) resolved to N elements
```

**Root cause:** Locator isn't scoped tightly enough. The same `data-testid`,
class, or role exists elsewhere (modals, hidden tabs, prerendered routes, the
same control rendered twice during a transition).

**Fix:** Scope through a parent `Locator`. Every element should resolve through
its container, not from the page root — see
[`create-page-object.md`](../../.claude/skills/create-page-object.md).

```ts
// ❌ Page-global — collides with same testid elsewhere
this.btnLogin = new Button({ locator: $getByTestId('signin-submit') });

// ✅ Scoped to the form inside main
this.container = $('main');
this.form = new Form(this.container);
this.btnLogin = this.form.getButton({ label: 'Log in' });
```

Only use `.first()` / `.nth(0)` when **selecting one of many** is the intent.
Never use it to silence a strict-mode violation.

---

### Pattern: Element detached / target closed mid-test

**Symptom:**
```
Error: Element is not attached to the DOM
Error: Target page, context or browser has been closed
```

**Root cause:** The app re-rendered (Vue/React reconciliation, route change,
modal close) between resolving the element and acting on it.

**Fix:**
1. Don't hold ElementHandles across async gaps — re-resolve via the page object.
2. After actions that trigger re-renders (route changes, modal close), call
   `waitForPageLoad()` before the next interaction.
3. For modals: use `modal.waitForHidden()` before asserting underlying page state.

---

### Pattern: Data leftover from prior runs causes intermittent failures

**Symptom:** Test fails when run in a suite, passes when run alone. Or: passes
the first time, fails the second. Or: random failures with errors like
"User already exists", "Email already in use".

**Root cause:** Test created data and never cleaned it up. Next run hits the
duplicate.

**Fix:** Every test owns its data. Create via factory, clean up in `afterEach` /
fixture teardown — see
[`manage-test-data.md`](../../.claude/skills/manage-test-data.md).

```ts
const email = DataGenerator.randomEmail('signin-spec');   // unique per run
```

For shared seed users you can't delete: at minimum, never edit them in tests.

---

### Pattern: Network mock not applied — real backend hit instead

**Symptom:** Mocked response is ignored; the test sees real backend data.

**Root cause:** `page.route()` was registered **after** `page.goto()` — the
initial requests fired before the route handler existed.

**Fix:** Register routes before navigation. See
[`mock-network.md`](../../.claude/skills/mock-network.md).

```ts
// ✅ Mock first, navigate second
await NetworkMock.fulfill('**/api/users', { body: { data: [] } });
await BrowserInstance.currentPage.goto(Endpoints.app.users);

// ❌ Mock never sees the request — page already loaded
await BrowserInstance.currentPage.goto(Endpoints.app.users);
await NetworkMock.fulfill('**/api/users', { body: { data: [] } });
```

---

### Pattern: Passes locally, fails in CI

**Symptom:** Green at `npm run test:e2e` on the dev machine, red on the CI build
of the same commit.

**Root causes (most common first):**
1. **Headless rendering differences** — viewport, fonts, animations. Run with the
   same viewport CI uses: `npm run test:e2e -- --project=chrome` and check
   `playwright.config.ts` `use.viewport`.
2. **Slower CI workers** — timeouts that just barely pass locally fail in CI.
   Don't blindly raise `timeout` — find the synchronization point (skeleton,
   response, toast) and gate on it explicitly.
3. **Test data shared with another CI worker** — see "data leftover" pattern
   above.
4. **CI starts in a different state** — no cached auth, no prewarmed connections.
   Use the global setup pattern from
   [`use-auth-state.md`](../../.claude/skills/use-auth-state.md).

**Debug:** Re-run the failed test with the trace artifact:
```bash
npx playwright show-trace test-results/<path>/trace.zip
```

---

### Pattern: Animation in progress at click time

**Symptom:** Click visibly happens but the app behaves as if it didn't —
modal opens then immediately closes, form submits but resets.

**Root cause:** The element was clicked during a CSS transition; the framework
captures the event but its own click handler hasn't attached yet.

**Fix:** Wait for the visible-and-stable state, not just visible:

```ts
await modal.openTrigger.click();
await modal.waitForVisible();        // visible
await modal.btnConfirm.waitFor({ state: 'visible' });
await modal.btnConfirm.click();      // safe — element settled
```

If the app uses `aria-busy` during transitions, wait on that attribute clearing
before the next interaction.

---

## Tips

- Use Playwright Inspector: `npx playwright test --debug`
- Check element visibility before interaction
- Use `test.only()` to run single test
- Use `test.skip()` to skip flaky tests temporarily
- Check console for detailed error messages
- **First reflex for a flaky test:** identify what changed on screen between the
  action and the assertion (skeleton hidden? response arrived? toast appeared?
  modal closed?). Gate on that, not on `setTimeout`.
