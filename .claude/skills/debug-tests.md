# Skill: Debug Tests

## When to Use

Use this skill when a test is failing, flaky, or behaving unexpectedly — whether locally or in CI.

## When NOT to Use

| Situation                            | Use instead                          |
| ------------------------------------ | ------------------------------------ |
| Writing a new test from scratch      | `write-e2e-test.md` / `write-api-test.md` |
| Refactoring working code             | `refactor-code.md`                   |
| Reviewing code for quality           | `code-review.md`                     |
| Setting up CI pipeline               | `setup-ci.md`                        |

## Workflow

```
1. Reproduce    → run the failing test in isolation
2. Classify     → match the failure to a known pattern
3. Investigate  → narrow down root cause with tools
4. Fix          → apply the targeted fix
5. Verify       → confirm fix + no regressions
```

## Step 1: Reproduce the Failure

### Run the specific test

```bash
# Single test file
npx playwright test tests/e2e/auth/sign-in.spec.ts --project=chrome

# Single test by name
npx playwright test -g "should sign in with valid credentials"

# With headed browser (see what happens)
npx playwright test tests/e2e/auth/sign-in.spec.ts --headed

# With debug mode (step through)
npx playwright test tests/e2e/auth/sign-in.spec.ts --debug
```

### Check if it's flaky

```bash
# Run 5 times — if it passes some and fails some, it's flaky
npx playwright test tests/e2e/auth/sign-in.spec.ts --repeat-each=5
```

### Reproduce CI failure locally

```bash
# Match CI conditions: headless, CI viewport, single worker
npx playwright test tests/e2e/auth/sign-in.spec.ts --project=e2e --workers=1
```

## Step 2: Classify the Failure

Match the error message to a known pattern. Each pattern has a specific fix.

### Error: Timeout waiting for selector

```
Timeout 30000ms exceeded waiting for selector
```

**Likely cause:** Element not rendered yet, or locator doesn't match.

**Debug steps:**
1. Run with `--debug` and check if element exists in DOM
2. Check parent scoping — is the locator resolving to the right container?
3. Check if a skeleton/loader is covering the element

**Fix:** Add `waitForPageLoad()` or scope the locator through the correct parent container.

---

### Error: Strict mode violation

```
strict mode violation: locator(...) resolved to N elements
```

**Likely cause:** Locator matches multiple elements (duplicate testid, modal + page, hidden tab).

**Debug steps:**
1. Open browser DevTools and count matches for the selector
2. Check if a modal or hidden section has the same testid

**Fix:** Scope through parent `Locator`. Never use `.first()` to silence this.

```ts
// ❌ Silences the error, doesn't fix the root cause
this.btnSubmit = new Button({ locator: $getByTestId('submit').first() });

// ✅ Scoped to the correct container
this.btnSubmit = this.form.getButton({ label: 'Submit' });
```

---

### Error: Element not clickable / intercepted

```
Element is outside of the viewport
Element is not visible
click intercepted by another element
```

**Likely cause:** Skeleton loader, overlay, animation, or scroll position.

**Debug steps:**
1. Take a screenshot right before the click: `await page.screenshot({ path: 'before-click.png' })`
2. Check if a skeleton is visible: `await skeleton.isVisible()`

**Fix:** Wait for skeleton to hide, or scroll into view.

```ts
await page.waitForPageLoad();  // waits for skeletons to hide
await element.scrollIntoView();
await element.click();
```

---

### Error: StaleElement / Target closed

```
Element is not attached to the DOM
Target page, context or browser has been closed
```

**Likely cause:** DOM re-rendered between locating and acting.

**Debug steps:**
1. Check if a navigation or AJAX update happened between the locate and the action
2. Check if a modal was closing while you interacted with the underlying page

**Fix:** Re-resolve the element via the page object after DOM changes. Use `waitForPageLoad()` after navigation.

---

### Error: Expected vs Received mismatch

```
Expected: "Login successful"
Received: ""
```

**Likely cause:** Assertion fired before the UI updated (notification dismissed, response not arrived).

**Debug steps:**
1. Add a `console.log` before the assertion to see timing
2. Check if the notification auto-dismissed before reading

**Fix:** Gate on the event, not on timing.

```ts
// ❌ Races the notification
expect(await notification.getMessage()).toBe('Login successful');

// ✅ Wait for the specific message
await notification.waitForMessage(NotificationMessages.auth.loginSuccess);
```

---

### Error: Passes locally, fails in CI

**Likely causes (most common first):**
1. **Headless rendering** — viewport/fonts differ. Match CI viewport locally.
2. **Slower workers** — timeouts pass locally, fail in CI. Gate on events, not timers.
3. **Shared test data** — parallel workers collide. Use unique data per test.
4. **No cached auth** — CI starts cold. Use `storageState` pattern.

**Debug steps:**
1. Download CI trace artifact: `npx playwright show-trace test-results/<path>/trace.zip`
2. Run locally with CI settings: `npx playwright test --project=e2e --workers=4`
3. Check if the test depends on execution order

---

### Error: API test returns unexpected status

```
Expected: 200
Received: 401
```

**Likely cause:** Token expired or not set.

**Debug steps:**
1. Enable API debug logging: `DEBUG_API=true npx playwright test`
2. Check token: `console.log(service.token)`

**Fix:** Ensure `setToken()` is called before the request.

```ts
const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
usersService.setToken(token);
```

## Step 3: Investigation Tools

### Playwright Inspector (interactive stepping)

```bash
npx playwright test tests/e2e/auth/sign-in.spec.ts --debug
```

- Step through each action
- Inspect element selectors live
- View locator highlights on the page

### Trace Viewer (post-mortem)

```bash
# Enable tracing in playwright.config.ts
use: { trace: 'on-first-retry' }

# View after failure
npx playwright show-trace test-results/<test-name>/trace.zip
```

Shows: screenshots at each step, DOM snapshots, network requests, console logs.

### Screenshots

```ts
// Manual screenshot at any point
await BrowserInstance.currentPage.screenshot({ path: 'debug.png' });

// Auto screenshot on failure (already configured)
// playwright.config.ts: screenshot: 'only-on-failure'
```

### Console Logging

```ts
// Element state
console.log('Visible:', await element.isVisible());
console.log('Text:', await element.getTextContent());
console.log('Count:', await element.element.count());

// API response
const { statusCode, data } = await service.get({ id: userId });
console.log('Status:', statusCode, 'Data:', JSON.stringify(data));

// Current URL
console.log('URL:', BrowserInstance.currentPage.url());
```

### Slow Motion

```ts
// playwright.config.ts — temporarily
use: {
    launchOptions: {
        slowMo: 500  // 500ms delay between actions
    }
}
```

### Network Monitoring

```ts
// Log all network requests during a test
BrowserInstance.currentPage.on('request', (req) => {
    console.log(`→ ${req.method()} ${req.url()}`);
});
BrowserInstance.currentPage.on('response', (res) => {
    console.log(`← ${res.status()} ${res.url()}`);
});
```

### Browser Console Errors

```ts
// Capture JavaScript errors from the page
BrowserInstance.currentPage.on('pageerror', (error) => {
    console.log('Page error:', error.message);
});
```

## Step 4: Apply the Fix

After identifying the root cause, apply the **targeted** fix:

| Root cause                | Fix                                                   | Skill reference           |
| ------------------------- | ----------------------------------------------------- | ------------------------- |
| Missing wait              | `waitForPageLoad()` or `waitForMessage()`              | `docs/guidance/skeleton.md` |
| Locator too broad         | Scope through parent container                         | `create-page-object.md`   |
| Data collision            | Use `DataGenerator.randomEmail()` + cleanup fixture    | `manage-test-data.md`     |
| Network race              | `ResponseHelper.waitFor()` before assertion            | `use-helper-functions.md` |
| Mock not applied          | Register `page.route()` before `page.goto()`           | `mock-network.md`         |
| Auth state missing        | Use `storageState` pattern                             | `use-auth-state.md`       |
| CI-specific               | Match viewport, use events not timers                  | `docs/troubleshooting/`   |

**Rules:**
- Never fix flakiness with `page.waitForTimeout()` — find the synchronization point
- Never fix strict-mode violations with `.first()` — scope the locator properly
- Never increase global timeout to hide a timing issue — gate on the specific event

## Step 5: Verify

```bash
# Run the fixed test multiple times
npx playwright test tests/e2e/auth/sign-in.spec.ts --repeat-each=5

# Run the full suite to check for regressions
npm run test:e2e

# Type-check
npx tsc --noEmit

# Lint
npm run lint
```

## Quick Reference: Error → Action

| Error message contains        | First action                              |
| ----------------------------- | ----------------------------------------- |
| `Timeout.*waiting for`        | Check parent scoping, add `waitForPageLoad` |
| `strict mode violation`       | Scope locator through parent container    |
| `not attached to the DOM`     | Re-resolve after DOM change               |
| `intercepted by`              | Wait for skeleton/overlay to hide         |
| `Expected.*Received: ""`      | Gate on event (notification, response)    |
| `401` / `403`                 | Check `setToken()` call                   |
| `Cannot find module`          | Check path alias in `tsconfig.json`       |
| Passes alone, fails in suite  | Data collision — use unique test data     |
| Passes locally, fails in CI   | Download trace, match CI viewport         |
