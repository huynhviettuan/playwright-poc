# Custom Expect Matchers

Custom expect matchers that work directly with element classes (Button, Input, etc.) without needing to access
`.element`.

All element matchers delegate to Playwright's native `expect(locator)` assertions internally, which means they
**auto-retry** until the assertion passes or the timeout is reached — just like Playwright's built-in locator assertions.
Both positive and negated (`.not`) forms retry correctly.

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
await expect(signInPage.main.txtEmail).toHaveId('email-input');
await expect(signInPage.main.btnLogin).toHaveClass('btn-primary');
await expect(signInPage.main.btnLogin).toHaveCSS('color', 'rgb(255, 255, 255)');
```

### DOM & Viewport

```ts
await expect(signInPage.main.btnLogin).toBeAttached();
await expect(signInPage.main.btnLogin).toBeInViewport();
await expect(signInPage.main.txtEmail).toBeFocused();
await expect(signInPage.main.txtEmail).toBeEditable();
await expect(signInPage.main.listItems).toHaveCount(5);
```

## Full Matcher Reference

### Element Matchers (accept `BaseControl`, auto-retry)

| Matcher                                 | What it checks                                        |
| --------------------------------------- | ----------------------------------------------------- |
| `toBeAttached()`                        | Element is attached to the DOM                        |
| `toBeChecked()`                         | Checkbox is checked                                   |
| `toBeDisabled()`                        | Element is disabled                                   |
| `toBeEditable()`                        | Element is editable                                   |
| `toBeEmpty()`                           | Container is empty                                    |
| `toBeEnabled()`                         | Element is enabled                                    |
| `toBeFocused()`                         | Element is focused                                    |
| `toBeHidden()`                          | Element is not visible                                |
| `toBeInViewport()`                      | Element intersects viewport                           |
| `toBeVisible()`                         | Element is visible                                    |
| `toContainText(expected)`               | Element contains text                                 |
| `toContainClass(expected)`              | Element has specified CSS classes                     |
| `toHaveAccessibleDescription(expected)` | Element has matching accessible description           |
| `toHaveAccessibleName(expected)`        | Element has matching accessible name                  |
| `toHaveAttribute(name, value)`          | Element has a DOM attribute                           |
| `toHaveClass(expected)`                 | Element has specified CSS class property              |
| `toHaveCount(expected)`                 | List has exact number of children                     |
| `toHaveCSS(name, value)`               | Element has CSS property                              |
| `toHaveId(expected)`                    | Element has an ID                                     |
| `toHaveJSProperty(name, value)`         | Element has a JavaScript property                     |
| `toHaveRole(expected)`                  | Element has a specific ARIA role                      |
| `toHaveText(expected)`                  | Element matches text                                  |
| `toHaveValue(expected)`                 | Input has a value                                     |
| `toHaveValues(expected[])`              | Select has options selected                           |
| `toMatchAriaSnapshot(expected)`         | Element matches the Aria snapshot                     |

### Utility Matchers

| Matcher                        | Accepts             | What it checks                  |
| ------------------------------ | ------------------- | ------------------------------- |
| `toBeOneOfValues(array)`       | any value           | `array.includes(received)`      |
| `toBeSorted(direction)`        | `string[]`          | Checks ascending/descending order |
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

Custom matchers are defined in `src/fixtures/expect-fixtures.ts` and automatically available when importing from
`@fixtures/fixtures`.

## Related

-   [notifications.md](notifications.md) — centralized notification fixture for toast/error messages
-   [messages.md](messages.md) — `NotificationMessages` constants
