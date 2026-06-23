# Debugging Tips

## Playwright Inspector

**Launch tests in debug mode:**

```bash
npx playwright test --debug
npx playwright test tests/e2e/auth/login.spec.ts --debug
```

**Features:**

-   Step through test execution
-   Inspect element selectors
-   View locator highlights
-   Record test actions

## Console Logging

**Log element states:**

```ts
console.log('Element visible:', await element.isVisible());
console.log('Element text:', await element.getTextContent());
console.log('Element count:', await element.count());
```

**Log API responses:**

```ts
const response = await service.getUser(token, id);
console.log('Status:', response.statusCode);
console.log('Body:', await response.response.json());
```

## Screenshots

**Capture on failure (automatic):**

```ts
// playwright.config.ts
screenshot: 'only-on-failure';
```

**Manual screenshot:**

```ts
await BrowserInstance.currentPage.screenshot({
    path: 'debug-screenshot.png'
});
```

## Trace Viewer

**Enable tracing:**

```ts
// playwright.config.ts
use: {
    trace: 'on-first-retry';
}
```

**View trace:**

```bash
npx playwright show-trace trace.zip
```

## Slow Motion

**Slow down execution:**

```ts
// playwright.config.ts
use: {
    launchOptions: {
        slowMo: 1000; // 1 second delay between actions
    }
}
```

## VSCode Debugging

**launch.json:**

```json
{
    "type": "node",
    "request": "launch",
    "name": "Debug Playwright Test",
    "program": "${workspaceFolder}/node_modules/.bin/playwright",
    "args": ["test", "${file}"],
    "console": "integratedTerminal"
}
```

## Quick Checks

1. **Element selector:** Use browser DevTools to verify selector
2. **Wait conditions:** Add explicit waits for dynamic content
3. **Network:** Check if API calls are completing
4. **Console errors:** Look for JavaScript errors in page
5. **Viewport:** Ensure element is in viewport before interaction
