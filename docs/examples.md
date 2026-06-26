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
    constructor() {
        super('/users');
    }

    protected getDefaultHeaders(): Record<string, string> {
        return { 'x-tenant-id': Config.tenantId };
    }
}

// Instance-level headers — set once, applied to all calls
const service = new ExternalService().setToken(token).setHeaders({ 'X-API-Key': apiKey });

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
const activeRow = allRows.withText('Active'); // new Label
const firstRow = allRows.withIndex(0); // new Label — allRows unchanged

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

## File Upload & Drop

```typescript
// Traditional file upload (input[type="file"])
await createUserPage.main.txtAvatar.uploadFile('avatar.png');
await createUserPage.main.txtAvatar.uploadFile('doc.pdf', { folderPath: 'src/data/files' });
await createUserPage.main.txtAvatar.uploadFile('image.png', { useBuffer: true });

// Drag-and-drop file onto upload zone (Playwright 1.61+ drop API)
await uploadPage.main.dropZone.dropFile('document.pdf');
await uploadPage.main.dropZone.dropFile('image.png', { folderPath: 'src/data/files' });

// Drop clipboard/text data
await uploadPage.main.dropZone.dropData({ 'text/plain': 'hello world' });
await uploadPage.main.dropZone.dropData({
    'text/plain': 'hello',
    'text/uri-list': 'https://example.com'
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

## Database Fixtures

Seed test data directly in PostgreSQL and auto-cleanup on teardown.

### Seed and Auto-Cleanup

```typescript
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';

test('should display seeded user in the UI', async ({ db, goto, usersPage }) => {
    // Arrange — seed() auto-queues cleanup
    const user = await db.seed<{ id: string; email: string }>({
        table: 'users',
        data: {
            email: DataGenerator.randomEmail('test'),
            name: 'Seeded User',
            role: 'member',
            created_at: new Date().toISOString()
        }
    });

    // Act
    await goto('/users');

    // Assert
    await expect(usersPage.main.table).toContainText(user!.email);
    // cleanup happens automatically when test ends
});
```

### Verify UI Action Persisted to Database

```typescript
test('should save form data to database', async ({ db, settingsPage }) => {
    await settingsPage.updateCompanyName('New Corp');

    const company = await db.findOne<{ name: string }>('companies', { id: companyId });
    expect(company?.name).toBe('New Corp');
});
```

### Query Helpers

```typescript
// Find one
const user = await db.findOne<User>('users', { email: 'admin@test.com' });

// Find many
const admins = await db.findMany<User>('users', { role: 'admin' });

// Check existence
const exists = await db.exists('users', { email: 'test@test.com' });

// Count
const total = await db.count('users', { role: 'admin' });

// Update
await db.update('users', { id: userId }, { name: 'Updated Name' });

// Raw SQL with parameterized queries
const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users u
     JOIN organizations o ON u.org_id = o.id
     WHERE o.name = $1 AND u.role = $2`,
    ['Acme Corp', 'admin']
);
```

### Skip Test Based on DB State

```typescript
test('admin-only feature', async ({ db }) => {
    const admin = await db.findOne('users', { role: 'superadmin' });
    test.skip(!admin, 'No superadmin in database');

    // ... test proceeds only if superadmin exists
});
```

## Accessibility Testing

Scan pages for WCAG violations using `@axe-core/playwright`.

### Full Page Audit

```typescript
import { expect, test } from '@fixtures/fixtures';
import { AccessibilityHelper } from '@helpers/accessibility.helper';

test('page should have no critical a11y violations', async ({ a11y }) => {
    const results = await a11y.scan();
    const critical = AccessibilityHelper.filterByImpact(results, 'serious');
    expect(critical).toHaveLength(0);
});
```

### WCAG 2.1 AA Compliance

```typescript
test('should meet WCAG 2.1 AA', async ({ a11y }) => {
    const results = await a11y.scan({ includeTags: ['wcag21aa', 'wcag2aa'] });
    expect(results.violations).toHaveLength(0);
});
```

### Scoped Scan

```typescript
// Only check the form
test('form should be accessible', async ({ a11y }) => {
    const results = await a11y.scan({ include: ['[data-testid="login-form"]'] });
    expect(results.violations).toHaveLength(0);
});

// Exclude third-party widgets
test('page minus ads should be accessible', async ({ a11y }) => {
    const results = await a11y.scan({ exclude: ['.ad-banner', 'iframe'] });
    expect(results.violations).toHaveLength(0);
});
```

### After User Interaction

```typescript
test('error state should remain accessible', async ({ signInPage, a11y }) => {
    await signInPage.main.btnLogin.click();
    await BrowserInstance.currentPage.waitForLoadState('domcontentloaded');

    const results = await a11y.scan();
    const critical = AccessibilityHelper.filterByImpact(results, 'serious');
    expect(critical).toHaveLength(0);
});
```

### Debug Failures

```typescript
const results = await a11y.scan();
if (results.violations.length > 0) {
    console.log(AccessibilityHelper.buildReport(results));
    // Output:
    // 2 violation(s) found:
    // [SERIOUS] color-contrast: Elements must have sufficient color contrast (3 instances)
    // [MODERATE] label: Form elements must have labels (1 instance)
}
expect(results.violations).toHaveLength(0);
```

### Override Options Per File

```typescript
test.use({
    a11yOptions: {
        includeTags: ['wcag21aa'],
        exclude: ['.cookie-banner']
    }
});

test.describe('Dashboard — WCAG 2.1 AA', () => {
    test('should pass', async ({ a11y }) => {
        const results = await a11y.scan();
        expect(results.violations).toHaveLength(0);
    });
});
```

## Multi-Environment Testing

Run tests against different environments using `TEST_ENV`.

### Environment-Aware Tests

```typescript
import { Config } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';

// Skip destructive tests in production
test.describe('User Management', () => {
    test.skip(() => Config.env === 'production', 'Skip destructive tests in production');

    test('should delete test user', async ({ usersPage }) => {
        // only runs in dev and staging
    });
});

// Run only in production
test.describe('Production Smoke', () => {
    test.skip(() => Config.env !== 'production', 'Only runs in production');

    test('should not expose debug info', async () => {
        const content = await BrowserInstance.currentPage.content();
        expect(content).not.toContain('stack trace');
    });
});
```

### Environment-Specific Test Data

```typescript
const testEmail = Config.env === 'production' ? 'readonly-user@example.com' : DataGenerator.randomEmail('test');
```

### Running Tests

```bash
# npm scripts
npm run test:e2e:dev
npm run test:e2e:staging
npm run test:e2e:production

# Direct
npx cross-env TEST_ENV=staging npx playwright test --project=e2e
```

### Intercept and Verify API Domain

```typescript
test('should call correct API for environment', async ({ signInPage }) => {
    const apiRequests: string[] = [];

    await BrowserInstance.currentPage.route('**/auth/**', (route) => {
        apiRequests.push(route.request().url());
        return route.continue();
    });

    await signInPage.signIn(Config.auth.superAdminEmail);

    const authRequest = apiRequests.find((url) => url.includes('auth'));
    expect(authRequest).toContain(Config.api.domain);
});
```

## Code Review

Use the `code-review` skill checklist for consistent reviews. Key checks:

```
🔴 Block — must fix before merge
  - Import from @playwright/test instead of @fixtures/fixtures
  - Page-global locator without parent scoping
  - Missing await on async operations
  - Hardcoded waitForTimeout
  - Inputs wired without Form component

🟡 Warn — should fix
  - Duplicated logic across files
  - Missing constant for hardcoded string/number
  - Vague test name

🟢 Nit — suggestion
  - Comment explaining "what" instead of "why"
```

See `.claude/skills/code-review.md` for the full checklist and output format.
