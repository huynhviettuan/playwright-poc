# Centralized Notification Management

Toast and notification UI is managed through a centralized `Notification` component and fixture.

## Usage

```ts
import { NotificationMessages } from '@constants/messages.constant';
import { expect, test } from '@fixtures/fixtures';

test('should show success message', async ({ signInPage, notification }) => {
    await signInPage.signIn('user@example.com');
    expect(await notification.getMessage()).toEqual(NotificationMessages.auth.loginSuccess);
});
```

## API

```ts
await notification.getMessage();
await notification.waitForVisible();
await notification.waitForHidden();
await notification.close();
await notification.waitForMessage(NotificationMessages.auth.loginSuccess);
```

## Best Practices

- Use the `notification` fixture instead of creating page-specific notification instances
- Use `NotificationMessages` constants instead of hardcoded strings
- Keep selectors centralized in `src/components/notification.component.ts`

## Related

- [Message Constants](../messages/README.md)
- [Custom Expect Matchers](../expect/README.md)
