---
description: Test files must use page objects and fixtures, never raw page.locator() calls
globs: ['tests/**/*.ts']
---

# No Raw Locators in Tests

Test files (`tests/**/*.ts`) must interact with the app through page objects and fixtures only.

```ts
// ✅ Correct — uses page object
await signInPage.signIn(email, password);
await expect(notification.success).toHaveText('Welcome');

// ❌ Wrong — raw locator in test file
await page.locator('#email').fill(email);
await page.locator('.toast-success').toHaveText('Welcome');
```

If a test needs an interaction that doesn't exist on the page object, add it to the page object first — don't bypass the
abstraction.
