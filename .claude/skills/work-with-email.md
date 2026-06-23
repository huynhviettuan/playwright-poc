# Skill: Working with Email/Mail

## When to Use

Use this skill when writing tests that involve email verification (registration, password reset, invitations, etc.).

## Critical Rules

### ✅ Use `Mail` Directly

No need to create separate mail classes per email type. Instantiate `Mail` directly and pass the subject from
`MailSubjects` to every method.

```ts
import { Mail } from '@mail/mail';
import { MailSubjects } from '@constants/mail-subjects.constant';

const mail = new Mail();
await mail.waitForMail(email, MailSubjects.auth.verifyEmail);
```

> ℹ️ There is **no** `BaseMail` class — only the `Mail` class and the `IMail` interface. Never write `new BaseMail()`.

### ✅ Centralize Subjects

All email subjects are managed in `@constants/mail-subjects.constant`.

```typescript
import { MailSubjects } from '@constants/mail-subjects.constant';

MailSubjects.auth.verifyEmail;
MailSubjects.auth.resetPassword;
MailSubjects.user.invitation;
MailSubjects.payment.receipt;
```

## Usage in Tests

### Basic Email Verification

```typescript
import { MailSubjects } from '@constants/mail-subjects.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';
import { Mail } from '@mail/mail';

test('should receive verification email', async () => {
    // Arrange
    const email = DataGenerator.randomEmail('test');
    const mail = new Mail();

    // Act
    await registerUser({ email });

    // Assert
    await mail.waitForMail(email, MailSubjects.auth.verifyEmail);
    const content = await mail.getContent(email, MailSubjects.auth.verifyEmail);
    expect(content).toContain('Click the link below to verify');
});
```

### Extract Token from Email

```typescript
import { MailSubjects } from '@constants/mail-subjects.constant';
import { Mail } from '@mail/mail';

test('should extract verification token', async () => {
    const email = DataGenerator.randomEmail('test');
    const mail = new Mail();

    await registerUser({ email });

    await mail.waitForMail(email, MailSubjects.auth.verifyEmail);
    const token = await mail.extractToken(email, MailSubjects.auth.verifyEmail);

    expect(token).toBeTruthy();
});
```

### Password Reset Email

```typescript
test('should receive password reset email', async () => {
    const email = 'user@example.com';
    const mail = new Mail();

    await requestPasswordReset(email);

    await mail.waitForMail(email, MailSubjects.auth.resetPassword);
    const token = await mail.extractToken(email, MailSubjects.auth.resetPassword);

    await resetPassword(token, 'NewPassword123!');
});
```

### Get Email Headers

```typescript
test('should verify email headers', async () => {
    const email = 'user@example.com';
    const mail = new Mail();

    await requestPasswordReset(email);

    const headers = await mail.getHeaderMailInformation(email, MailSubjects.auth.resetPassword);

    expect(headers.to).toEqual(email);
    expect(headers.subject).toEqual(MailSubjects.auth.resetPassword);
});
```

### Clean Up Emails

```typescript
test.afterEach(async () => {
    const mail = new Mail();
    await mail.deleteAllMails();
});

// Or delete emails for specific user
test.afterEach(async () => {
    const mail = new Mail();
    await mail.deleteMailByUser(testEmail, MailSubjects.auth.verifyEmail);
});
```

## Available Methods

### `getMails(params)`

Get all emails matching criteria.

```typescript
const mails = await mail.getMails({
    to: email,
    subject: MailSubjects.auth.verifyEmail
});
```

### `waitForMail(to, subject)`

Wait for email to arrive.

```typescript
await mail.waitForMail(email, MailSubjects.auth.verifyEmail);
```

### `getLatestMail(to, subject)`

Get the most recent email.

```typescript
const latest = await mail.getLatestMail(email, MailSubjects.auth.resetPassword);
```

### `getMailBox(to, subject)`

Get all emails for user with subject.

```typescript
const inbox = await mail.getMailBox(email, MailSubjects.auth.verifyEmail);
```

### `extractToken(email, subject)`

Extract token from email HTML.

```typescript
const token = await mail.extractToken(email, MailSubjects.auth.verifyEmail);
```

### `getContent(email, subject)`

Get plain text content.

```typescript
const text = await mail.getContent(email, MailSubjects.auth.verifyEmail);
```

### `getHtml(to, subject)`

Get raw HTML content.

```typescript
const html = await mail.getHtml(email, MailSubjects.auth.verifyEmail);
```

### `deleteMailByUser(to, subject)`

Delete emails for specific user and subject.

```typescript
await mail.deleteMailByUser(email, MailSubjects.auth.verifyEmail);
```

### `deleteAllMails()`

Delete all emails.

```typescript
await mail.deleteAllMails();
```

## Complete Example

```typescript
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { MailSubjects } from '@constants/mail-subjects.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';
import { Mail } from '@mail/mail';

test.describe('User Registration with Email Verification', () => {
    const mail = new Mail();
    const testEmail = DataGenerator.randomEmail('test');

    test.afterEach(async () => {
        await mail.deleteMailByUser(testEmail, MailSubjects.auth.verifyEmail);
    });

    test('should complete registration flow', async ({ registrationPage }) => {
        // Step 1: Register
        await BrowserInstance.currentPage.goto(Endpoints.auth.register);
        await registrationPage.fillForm({
            email: testEmail,
            password: 'Test123!'
        });
        await registrationPage.submit();

        // Step 2: Wait for email
        await mail.waitForMail(testEmail, MailSubjects.auth.verifyEmail);

        // Step 3: Extract token
        const token = await mail.extractToken(testEmail, MailSubjects.auth.verifyEmail);
        expect(token).toBeTruthy();

        // Step 4: Verify content
        const content = await mail.getContent(testEmail, MailSubjects.auth.verifyEmail);
        expect(content).toContain('Click the link below to verify');
    });
});
```

## Best Practices

✅ **Use `Mail` directly** - No need for separate mail classes per email type ✅ **Use subject constants** - Never
hardcode email subjects ✅ **Clean up emails** - Delete test emails after each test ✅ **Use random emails** -
`DataGenerator.randomEmail()` for unique addresses ✅ **Wait before reading** - Always `waitForMail()` before extracting
content

## Related

-   [Mail Class](../../src/mail/mail.ts)
-   [Mail Subjects](../../src/constants/mail-subjects.constant.ts)
-   [Mail Interface](../../src/models/mail/mail.interface.ts)
