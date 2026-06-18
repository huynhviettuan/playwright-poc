# Basic E2E Test Example

Complete example of a basic end-to-end test with authentication.

## Code

```typescript
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('User Login', () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
    });
    
    test('should login with valid credentials', async ({ signInPage }) => {
        // Arrange
        const email = 'user@example.com';
        
        // Act
        await signInPage.signIn(email);
        
        // Assert
        const title = await signInPage.getTitle();
        await expect(title).toEqual('Dashboard');
    });
    
    test('should show error with invalid credentials', async ({ signInPage }) => {
        // Arrange
        const invalidEmail = 'invalid@example.com';
        
        // Act
        await signInPage.signIn(invalidEmail);
        
        // Assert
        const errorMessage = await signInPage.main.getErrorMessage();
        await expect(errorMessage).toContain('Invalid credentials');
    });
});
```

## Key Points

- ✅ Always import from `@fixtures/fixtures`
- ✅ Use `test.describe()` to group related tests
- ✅ Use `test.beforeEach()` for navigation setup
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Use page object methods, not raw locators
- ✅ Use descriptive test names

## Related

- [Write E2E Test Skill](../../.claude/skills/write-e2e-test.md)
- [Create Page Object Skill](../../.claude/skills/create-page-object.md)
