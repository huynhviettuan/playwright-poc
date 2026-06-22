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
        await signInPage.signIn('user@example.com');

        await expect(signInPage.header.lblTitle).toHaveText('Dashboard');
    });
});
```

## API Test

```typescript
import { Config } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';

test.describe('API - Users', () => {
    test('should get user by ID', async ({ usersService, apiCommands }) => {
        // Arrange
        const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
        usersService.setToken(token);
        const userId = '123';

        // Act — data is already typed as User
        const { statusCode, data } = await usersService.getById(userId);

        // Assert
        expect(statusCode).toBe(StatusCodes.OK);
        expect(data.id).toBe(userId);
        expect(data.email).toBeTruthy();
    });

    test('should create and delete user', async ({ usersService, apiCommands }) => {
        const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
        usersService.setToken(token);

        // Create
        const { statusCode: createStatus, data: created } = await usersService.create({
            name: DataGenerator.randomName(),
            email: DataGenerator.randomEmail('api-test')
        });
        expect(createStatus).toBe(StatusCodes.CREATED);

        // Delete
        const { statusCode } = await usersService.deleteById(created.id);
        expect(statusCode).toBe(StatusCodes.NO_CONTENT);
    });
});
```

## Custom Headers

```typescript
// Multi-tenant service — default headers via subclass
export class TenantUsersService extends BaseService {
    constructor() { super('/users'); }

    protected getDefaultHeaders(): Record<string, string> {
        return { 'x-tenant-id': Config.tenantId };
    }
}

// Instance-level headers — set once, applied to all calls
const service = new ExternalService()
    .setToken(token)
    .setHeaders({ 'X-API-Key': apiKey });

// Per-request headers — one-off override
await service.send('get', {
    headers: { 'Accept-Language': 'vi' }
});
```

## Page with Table

```typescript
import { expect, test } from '@fixtures/fixtures';

test('should search and select user from table', async ({ usersPage }) => {
    await usersPage.main.searchUser('John Doe');
    const userRow = await usersPage.main.getUserByEmail('john@example.com');

    await expect(userRow).toBeVisible();
});
```

## Form Interaction

```typescript
import { DataGenerator } from '@helpers/generate-data-functions';
import { expect, test } from '@fixtures/fixtures';

test('should create new user', async ({ createUserPage, notification }) => {
    const userData = {
        name: DataGenerator.randomName(),
        email: DataGenerator.randomEmail('test'),
        phone: DataGenerator.randomPhone()
    };

    // By label
    await createUserPage.main.form.getInput({ label: 'Name' }).fill(userData.name);
    await createUserPage.main.form.getInput({ label: 'Email' }).fill(userData.email);

    // By id (preferred when available — most stable)
    await createUserPage.main.form.getInput({ id: 'phone-input' }).fill(userData.phone);
    await createUserPage.main.form.getButton({ id: 'submit-btn' }).click();

    expect(await notification.getMessage()).toContain('User created');
});
```

## Element Locating by ID

All elements support the `id` option — locates by HTML `id` attribute:

```typescript
// Available on every element type
new Button({ parentLocator: container, id: 'submit-btn' });
new Input({ parentLocator: container, id: 'email-input' });
new Link({ parentLocator: container, id: 'forgot-link' });
new Label({ parentLocator: container, id: 'title-label' });
new Dropdown({ parentLocator: container, id: 'role-select' });
new CheckBox({ parentLocator: container, id: 'agree-checkbox' });

// Priority: id > label/text > index
```

## Custom Expect Matchers

All matchers work directly on element wrappers — no `.element` needed:

```typescript
// Visibility & state
await expect(signInPage.main.btnLogin).toBeVisible();
await expect(signInPage.main.btnLogin).toBeHidden();
await expect(signInPage.main.btnLogin).toBeEnabled();
await expect(signInPage.main.btnLogin).toBeDisabled();
await expect(signInPage.main.chkRemember).toBeChecked();

// Text
await expect(signInPage.header.lblTitle).toHaveText('Sign In');
await expect(signInPage.main.lblError).toContainText('Invalid');

// Attributes & values
await expect(signInPage.main.txtPassword).toHaveAttribute('type', 'password');
await expect(signInPage.main.txtEmail).toHaveValue('user@example.com');

// Non-element matchers
expect(user.role).toBeOneOfValues(['admin', 'user', 'guest']);
expect(names).toBeSorted(SortDirectionEnum.ASCENDING);
await expect('report.pdf').toBeExistInDownloadsFolder();
```

## Immutable Element Filtering

`withText()` and `withIndex()` return new instances — the original is unchanged:

```typescript
const allRows = new Label({ parentLocator: table, locator: 'tr' });
const activeRow = allRows.withText('Active');  // new Label
const firstRow = allRows.withIndex(0);         // new Label — allRows unchanged

await expect(activeRow).toBeVisible();
```

## Using Helper Functions

```typescript
import { DateTimeHelper } from '@helpers/date-time-functions';
import { DataGenerator } from '@helpers/generate-data-functions';
import { ArrayHelper } from '@helpers/helper-functions';

test('helper functions demo', async () => {
    // Date helpers (accepts moment-style format tokens — converted internally to date-fns)
    const today = DateTimeHelper.today('DD/MM/YYYY');
    const lastWeek = DateTimeHelper.subtractDays(7);
    const unix = DateTimeHelper.todayUnix();

    // Data generation (powered by faker.js)
    const email = DataGenerator.randomEmail('test');
    const users = Array.from({ length: 5 }, () => ({
        name: DataGenerator.randomName(),
        email: DataGenerator.randomEmail('batch')
    }));

    // Array processing — sequential
    await ArrayHelper.forEachSync(users, async (user) => {
        await createUser(user);
    });
});
```

## Modal Interaction

```typescript
import { Modal } from '@components/modal.component';

test('should confirm delete action', async () => {
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

    // Open new page (current page pushed to stack)
    const page2 = await BrowserInstance.startNewPage();
    await page2.goto('https://google.com');

    // Switch back (pops from stack)
    await BrowserInstance.switchToPreviousPage();
    expect(BrowserInstance.currentPage).toBe(page1);
});
```

## Schema Validation

```typescript
import { validateJsonSchema } from '@helpers/validate-schema.helper';

// Validate response against a schema file (src/data/schemas/users/GET_users_schema.json)
const { data } = await usersService.getAll();
await validateJsonSchema('GET_users', 'users', data);

// Create schema from response first, then validate (useful for bootstrapping)
await validateJsonSchema('GET_users', 'users', data, true);
```
