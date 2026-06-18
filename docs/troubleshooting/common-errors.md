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

## Tips

- Use Playwright Inspector: `npx playwright test --debug`
- Check element visibility before interaction
- Use `test.only()` to run single test
- Use `test.skip()` to skip flaky tests temporarily
- Check console for detailed error messages
