# Complex Form Interaction Example

Example of handling complex forms with multiple fields and validation.

## Code

```typescript
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { DataGenerator } from '@helpers/generate-data-functions';
import { expect, test } from '@fixtures/fixtures';

test.describe('Create User Form', () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(Endpoints.admin.createUser);
    });

    test('should create new user with valid data', async ({ createUserPage }) => {
        // Arrange
        const userData = {
            name: DataGenerator.randomName(),
            email: DataGenerator.randomEmail('test'),
            phone: DataGenerator.randomPhone()
        };

        // Act - Using Form component
        await createUserPage.main.fillUserForm(userData);
        await createUserPage.main.submit();

        // Assert
        await expect(await createUserPage.main.toast.getMessage()).toContain('User created');
    });

    test('should show validation errors for invalid data', async ({ createUserPage }) => {
        // Act
        await createUserPage.main.form.getInput({ label: 'Email' }).fill('invalid-email');
        await createUserPage.main.submit();

        // Assert
        const error = await createUserPage.main.getFieldError('Email');
        await expect(error).toContain('Invalid email format');
    });
});
```

## Container Implementation

```typescript
// src/components/containers/create-user/main.container.ts
import { Form } from '@components/form.component';
import { Toast } from '@components/toast.component';

export class CreateUserMainContainer {
    readonly form: Form;
    readonly toast: Toast;

    constructor() {
        this.form = new Form($('.create-user-form'));
        this.toast = new Toast();
    }

    async fillUserForm(data: { name: string; email: string; phone: string }): Promise<void> {
        await this.form.getInput({ label: 'Name' }).fill(data.name);
        await this.form.getInput({ label: 'Email' }).fill(data.email);
        await this.form.getInput({ label: 'Phone' }).fill(data.phone);
    }

    async submit(): Promise<void> {
        await this.form.getButton({ label: 'Submit' }).click();
    }

    async getFieldError(fieldLabel: string): Promise<string> {
        const error = this.form.form.locator(`.field-error:near(label:has-text("${fieldLabel}"))`);
        return await error.textContent();
    }
}
```

## Key Points

-   ✅ Use `DataGenerator` for random test data
-   ✅ Use `Form` component for form interactions
-   ✅ Extract form filling logic into container methods
-   ✅ Use `Toast` component for notifications
-   ✅ Validate both success and error scenarios

## Related

-   [Form Component](../src/components/form.component.ts)
-   [Toast Component](../src/components/toast.component.ts)
-   [Use Helper Functions Skill](../.claude/skills/use-helper-functions.md)
