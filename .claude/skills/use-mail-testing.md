# Skill: Use Mail Testing

## When to Use
Use this skill when testing email flows like password reset, verification emails, or notification emails.

## Critical Rules

### ✅ Use Mail Fixtures
- Mail services should be registered in `mail-fixtures.ts`
- Use fixtures in tests, don't instantiate mail classes directly
- Clean up emails after tests when needed

### ✅ Follow SOLID Principles
- Mail classes extend `BaseMail`
- Parsing logic stays in mail helpers
- Tests should only use public mail methods

## BaseMail API

```ts
interface IMail {
    mailDomain: string;
    subject: string;
    getMails(mail: { to: string; subject?: string }): Promise<MailResponse[]>;
    waitForMail(to: string, subject: string): Promise<void>;
    getMailBox(to: string): Promise<MailResponse[]>;
    getLatestMail(to: string, subject: string): Promise<MailResponse>;
    getHeaderMailInformation(to: string, subject: string): Promise<{ subject: string; from: string; to: string }>;
    getHtml(to: string, subject: string): Promise<string>;
    deleteMailByUser(to: string): Promise<void>;
    extractToken(email: string): Promise<string>;
    getContent(email: string): Promise<string>;
    deleteAllMails(): Promise<void>;
    getMailContent(to: string): Promise<MailResponse>;
}
```

## Create Mail Class

```ts
import { BaseMail } from '@mail/mail';

export class PasswordResetMail extends BaseMail {
    constructor() {
        super();
        this.subject = 'Reset your password';
    }
}
```

## Register Mail Fixture

```ts
// src/fixtures/mail-fixtures.ts
import { PasswordResetMail } from '@mail/password-reset.mail';
import { test as base } from '@playwright/test';

type MailFixtures = {
    passwordResetMail: PasswordResetMail;
};

export const test = base.extend<MailFixtures>({
    passwordResetMail: async ({}, use) => {
        await use(new PasswordResetMail());
    }
});
```

## Usage in Tests

### Password Reset Flow

```ts
import { DataGenerator } from '@helpers/generate-data-functions';
import { expect, test } from '@fixtures/fixtures';

test('should send password reset email', async ({ signInPage, passwordResetMail }) => {
    // Arrange
    const email = DataGenerator.randomEmail('reset');
    
    // Act
    await signInPage.requestPasswordReset(email);
    
    // Assert
    await passwordResetMail.waitForMail(email, passwordResetMail.subject);
    const content = await passwordResetMail.getContent(email);
    expect(content).toContain('Reset your password');
});
```

### Extract Token from Email

```ts
test('should extract reset token', async ({ passwordResetMail }) => {
    // Arrange
    const email = 'user@example.com';
    
    // Act
    const token = await passwordResetMail.extractToken(email);
    
    // Assert
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(0);
});
```

### Verify Email Headers

```ts
test('should have correct email headers', async ({ passwordResetMail }) => {
    const email = 'user@example.com';
    
    const headers = await passwordResetMail.getHeaderMailInformation(
        email,
        passwordResetMail.subject
    );
    
    expect(headers.subject).toBe(passwordResetMail.subject);
    expect(headers.to).toContain(email);
});
```

### Clean Up Emails

```ts
test.afterEach(async ({ passwordResetMail }) => {
    await passwordResetMail.deleteMailByUser(testEmail);
});

// Or delete all emails
await passwordResetMail.deleteAllMails();
```

## Best Practices

### ✅ Good
```ts
// Use fixture
 test('test email', async ({ passwordResetMail }) => {
    await passwordResetMail.waitForMail(email, passwordResetMail.subject);
});
```

### ❌ Bad
```ts
// Don't instantiate directly in tests
const mail = new PasswordResetMail();
```

### ✅ Good - Use DataGenerator
```ts
const email = DataGenerator.randomEmail('mail-test');
```

### ❌ Bad - Hardcoded email
```ts
const email = 'test@gmail.com';
```

## Common Patterns

### Wait and Get Content
```ts
await mail.waitForMail(email, mail.subject);
const content = await mail.getContent(email);
```

### Get Latest Mail
```ts
const latestMail = await mail.getLatestMail(email, mail.subject);
expect(latestMail.subject).toBe(mail.subject);
```

### Verify Mailbox
```ts
const mails = await mail.getMailBox(email);
expect(mails.length).toBeGreaterThan(0);
```

## Error Handling

`waitForMail()` retries for 30 seconds by default. If email doesn't arrive:

```
Error: No Email with subject "Reset your password" to user@example.com
```

Check:
1. Email address is correct
2. Subject matches exactly
3. Mail server is running
4. Application actually sent the email
