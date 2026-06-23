# Page with Table Example

Example of interacting with tables using the Table component.

## Code

```typescript
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('User Management Table', () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(Endpoints.admin.users);
    });

    test('should search and select user from table', async ({ usersPage }) => {
        // Arrange
        const searchQuery = 'John Doe';

        // Act
        await usersPage.main.searchUser(searchQuery);
        const userRow = await usersPage.main.getUserByEmail('john@example.com');

        // Assert
        await expect(userRow).toBeVisible();
    });

    test('should get all users from specific column', async ({ usersPage }) => {
        // Act
        const emails = await usersPage.main.tblUsers.getColumnData('Email');

        // Assert
        expect(emails.length).toBeGreaterThan(0);
        expect(emails[0]).toContain('@');
    });

    test('should verify user data in table', async ({ usersPage }) => {
        // Arrange
        const expectedUser = {
            Name: 'John Doe',
            Email: 'john@example.com',
            Role: 'Admin'
        };

        // Act
        const userRow = await usersPage.main.tblUsers.getRowWithData(expectedUser);

        // Assert
        await expect(userRow).toBeVisible();
    });
});
```

## Key Points

-   ✅ Use `Table` component for table interactions
-   ✅ Use `getRowWithData()` to find rows by multiple criteria
-   ✅ Use `getColumnData()` to get all values from a column
-   ✅ Search before filtering for better performance
-   ✅ Always check visibility before assertions

## Related

-   [Table Component](../src/components/table.component.ts)
-   [Create Page Object Skill](../.claude/skills/create-page-object.md)
