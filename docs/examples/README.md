# Examples

Quick reference examples for common test scenarios.

## Basic E2E Test

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
        await expect(await signInPage.getTitle()).toEqual('Dashboard');
    });
});
```

## API Test with Validation

```typescript
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';
import { ResponseHelper } from '@helpers/helper-functions';

test.describe('API - Users', () => {
    let token: string;
    
    test.beforeAll(async ({ tokensService }) => {
        const response = await tokensService.getToken();
        token = await ResponseHelper.toJson(response).then(r => r.token);
    });
    
    test('should get user by ID', async ({ userService }) => {
        // Arrange
        const userId = '123';
        
        // Act
        const { statusCode, response } = await userService.getUser(token, userId);
        
        // Assert
        expect(statusCode).toBe(StatusCodes.OK);
        const user = await response.json();
        expect(user).toHaveProperty('id', userId);
        expect(user).toHaveProperty('email');
    });
});
```

## Page with Table

```typescript
import { expect, test } from '@fixtures/fixtures';

test('should search and select user from table', async ({ usersPage }) => {
    // Arrange
    const searchQuery = 'John Doe';
    
    // Act
    await usersPage.main.searchUser(searchQuery);
    const userRow = await usersPage.main.getUserByEmail('john@example.com');
    
    // Assert
    await expect(userRow).toBeVisible();
});
```

## Complex Form Interaction

```typescript
import { DataGenerator } from '@helpers/generate-data-functions';
import { expect, test } from '@fixtures/fixtures';

test('should create new user', async ({ createUserPage }) => {
    // Arrange
    const userData = {
        name: DataGenerator.randomName(),
        email: DataGenerator.randomEmail('test'),
        phone: DataGenerator.randomPhone()
    };
    
    // Act
    await createUserPage.main.form.getInput({ label: 'Name' }).fill(userData.name);
    await createUserPage.main.form.getInput({ label: 'Email' }).fill(userData.email);
    await createUserPage.main.form.getInput({ label: 'Phone' }).fill(userData.phone);
    await createUserPage.main.form.getButton({ label: 'Submit' }).click();
    
    // Assert
    await expect(await createUserPage.main.toast.getMessage()).toContain('User created');
});
```

## Using Helper Functions

```typescript
import { DateCalculation, DateFormatting } from '@helpers/date-time';
import { DataGenerator } from '@helpers/generate-data-functions';
import { ArrayHelper } from '@helpers/helper-functions';

test('helper functions demo', async () => {
    // Date helpers
    const today = DateFormatting.today('YYYY-MM-DD');
    const lastWeek = DateCalculation.subtractDays(7);
    
    // Data generation
    const email = DataGenerator.randomEmail('test');
    const users = Array.from({ length: 5 }, () => ({
        name: DataGenerator.randomName(),
        email: DataGenerator.randomEmail()
    }));
    
    // Array processing
    await ArrayHelper.forEachSync(users, async (user) => {
        await createUser(user);
    });
});
```

## Modal Interaction

```typescript
import { Modal } from '@components/modal.component';

test('should confirm delete action', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Interact with modal
    const modal = new Modal('.confirm-modal');
    await modal.waitForVisible();
    await modal.getButton({ label: 'Confirm' }).click();
    await modal.waitForHidden();
});
```

## Page Switching

```typescript
import { BrowserInstance } from '@common/browser';

test('should switch between multiple pages', async () => {
    const page1 = BrowserInstance.currentPage;
    await page1.goto('https://example.com');
    
    // Open new page
    const page2 = await BrowserInstance.startNewPage();
    await page2.goto('https://google.com');
    
    // Switch back
    await BrowserInstance.switchToPreviousPage();
    expect(BrowserInstance.currentPage).toBe(page1);
});
```
