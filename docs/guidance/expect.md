# Custom Expect Matchers

Custom expect matchers that work directly with element classes (Button, Input, etc.) without needing to access `.element`.

## Available Matchers

### Element Visibility

```ts
await expect(signInPage.main.btnLogin).toBeVisible();
await expect(signInPage.main.btnCancel).toBeHidden();
```

### Element State

```ts
await expect(signInPage.main.txtEmail).toBeEnabled();
await expect(signInPage.main.btnSubmit).toBeDisabled();
```

### Text Content

```ts
await expect(signInPage.header.lblTitle).toHaveText('Sign In');
await expect(signInPage.main.lblError).toContainText('Invalid credentials');
```

### Attributes & Values

```ts
await expect(signInPage.main.txtPassword).toHaveAttribute('type', 'password');
await expect(signInPage.main.txtEmail).toHaveValue('user@example.com');
await expect(signInPage.main.chkRememberMe).toBeChecked();
```

## Complete Example

```ts
import { expect, test } from '@fixtures/fixtures';

test('should validate form elements', async ({ signInPage }) => {
    await expect(signInPage.main.btnLogin).toBeVisible();
    await expect(signInPage.main.lnkForgotPassword).toBeVisible();

    await expect(signInPage.main.txtEmail).toBeEnabled();
    await expect(signInPage.main.btnLogin).toBeDisabled();

    await expect(signInPage.header.lblTitle).toHaveText('Sign In');

    await signInPage.main.txtEmail.fill('test@example.com');
    await signInPage.main.txtPassword.fill('password');

    await expect(signInPage.main.btnLogin).toBeEnabled();
});
```

## Before vs After

### Before

```ts
await expect(await signInPage.main.btnLogin.isVisible()).toBeTruthy();
await expect(signInPage.main.txtEmail.element).toBeVisible();
await expect(await signInPage.header.lblTitle.getTextContent()).toEqual('Sign In');
```

### After

```ts
await expect(signInPage.main.btnLogin).toBeVisible();
await expect(signInPage.main.txtEmail).toBeVisible();
await expect(signInPage.header.lblTitle).toHaveText('Sign In');
```

## Other Custom Matchers

```ts
expect(user.role).toBeOneOfValues(['admin', 'user', 'guest']);
expect(names).toBeSorted(SortDirectionEnum.ASCENDING);
await expect('report.pdf').toBeExistInDownloadsFolder();
```

## Implementation

Custom matchers are defined in `src/fixtures/expect-fixtures.ts` and automatically available when importing from `@fixtures/fixtures`.

## Benefits

- Cleaner tests: no `.element` or `await isVisible()`
- Type-safe with BaseControl-based elements
- Consistent API across elements
- Tests read like natural language
