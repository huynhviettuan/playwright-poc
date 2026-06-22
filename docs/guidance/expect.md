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
await expect(signInPage.main.chkRememberMe).toBeChecked();
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
```

`toHaveAttribute(name, value)` — checks any HTML attribute. `value` can be a string (exact match) or RegExp.

`toHaveValue(expected)` — reads the input's current value via `inputValue()`. Works with all input types including empty strings and `'0'`.

## Full Matcher Reference

| Matcher | Accepts | What it checks |
|---------|---------|----------------|
| `toBeVisible()` | `BaseControl` | `element.isVisible()` |
| `toBeHidden()` | `BaseControl` | `element.isHidden()` |
| `toBeEnabled()` | `BaseControl` | `element.isEnabled()` |
| `toBeDisabled()` | `BaseControl` | `element.isDisabled()` |
| `toBeChecked()` | `BaseControl` | `element.isChecked()` |
| `toHaveText(expected)` | `BaseControl` | `element.getTextContent() === expected` |
| `toContainText(expected)` | `BaseControl` | `element.getTextContent().includes(expected)` |
| `toHaveAttribute(name, value)` | `BaseControl` | `element.getAttribute(name)` matches value (string or RegExp) |
| `toHaveValue(expected)` | `BaseControl` | `element.inputValue() === expected` |
| `toBeOneOfValues(array)` | any value | `array.includes(received)` |
| `toBeSorted(direction)` | `string[]` | Checks ascending/descending order |
| `toBeExistInDownloadsFolder()` | `string` (filename) | File exists in `src/downloads/` |

## Complete Example

```ts
import { expect, test } from '@fixtures/fixtures';

test('should validate form elements', async ({ signInPage }) => {
    // Visibility
    await expect(signInPage.main.btnLogin).toBeVisible();
    await expect(signInPage.main.lnkForgotPassword).toBeVisible();

    // State
    await expect(signInPage.main.txtEmail).toBeEnabled();
    await expect(signInPage.main.btnLogin).toBeDisabled();

    // Text
    await expect(signInPage.header.lblTitle).toHaveText('Sign In');

    // Fill and verify
    await signInPage.main.txtEmail.fill('test@example.com');
    await signInPage.main.txtPassword.fill('password');

    await expect(signInPage.main.btnLogin).toBeEnabled();
    await expect(signInPage.main.txtPassword).toHaveAttribute('type', 'password');
    await expect(signInPage.main.txtEmail).toHaveValue('test@example.com');
});
```

## Before vs After

### Before

```ts
await expect(await signInPage.main.btnLogin.isVisible()).toBeTruthy();
await expect(signInPage.main.txtEmail.element).toBeVisible();
await expect(await signInPage.header.lblTitle.getTextContent()).toEqual('Sign In');
await expect(await signInPage.main.txtPassword.getAttribute('type')).toBe('password');
```

### After

```ts
await expect(signInPage.main.btnLogin).toBeVisible();
await expect(signInPage.main.txtEmail).toBeVisible();
await expect(signInPage.header.lblTitle).toHaveText('Sign In');
await expect(signInPage.main.txtPassword).toHaveAttribute('type', 'password');
```

## Other Custom Matchers

```ts
expect(user.role).toBeOneOfValues(['admin', 'user', 'guest']);
expect(names).toBeSorted(SortDirectionEnum.ASCENDING);
await expect('report.pdf').toBeExistInDownloadsFolder();
```

## Implementation

Custom matchers are defined in `src/fixtures/expect-fixtures.ts` and automatically available when importing from `@fixtures/fixtures`.

## Related

- [notifications.md](notifications.md) — centralized notification fixture for toast/error messages
- [messages.md](messages.md) — `NotificationMessages` constants
