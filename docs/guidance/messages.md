# Message Constants Management

All notification, toast, and validation messages are centralized in one place for consistency and maintainability.

## Location

`src/constants/messages.constant.ts`

## Usage

```ts
import { NotificationMessages } from '@constants/messages.constant';
import { expect, test } from '@fixtures/fixtures';

test('should show login success message', async ({ signInPage, notification }) => {
    await signInPage.signIn('user@example.com');
    expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
});
```

## Why Use Message Constants?

- Single source of truth
- Type-safe and autocomplete-friendly
- Avoids typos and inconsistent copy
- Product text changes are updated in one place

## Examples

```ts
expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
expect(await notification.getMessage()).toEqual(NotificationMessages.payment.success);

const error = await signUpPage.main.getFieldError('Email');
expect(error).toEqual(NotificationMessages.validation.invalidEmail);
```

## Message Categories

- `auth` - Login, logout, session, password messages
- `user` - User create, update, delete messages
- `payment` - Payment status messages
- `validation` - Field validation messages
- `general` - Generic save, network, server messages

## Adding New Messages

```ts
export const NotificationMessages = {
    order: {
        created: 'Order created successfully',
        shipped: 'Order has been shipped',
        delivered: 'Order delivered'
    }
} as const;
```

## Partial Match Pattern

For dynamic messages:

```ts
const message = await notification.getMessage();
expect(message).toContain(NotificationMessages.user.created);
```

## Best Practices

- Always use constants, never hardcode messages in tests
- Group messages by feature
- Use `as const` for literal typing
- Use descriptive names like `loginSuccess`, not `msg1`
- Update message text in one place when product copy changes

## Related

- [Centralized Notification](./notifications.md)
- [Custom Expect Matchers](./expect.md)
