# Skill: Manage Database Fixtures

## When to Use

Use this skill when tests need direct database access for setup, verification, or cleanup — complementing API-based test
data management.

## When NOT to Use

| Situation                                | Use instead              |
| ---------------------------------------- | ------------------------ |
| Test data can be created/cleaned via API | `manage-test-data.md`    |
| You need to test API behavior            | `write-api-test.md`      |
| You're testing UI interactions           | `write-e2e-test.md`      |
| DB schema changes / migrations           | Handle outside test code |

## Critical Rules

### ✅ ALWAYS Use the `db` Fixture

```ts
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER create DatabaseHelper directly in tests
```

### ✅ ALWAYS Use `seed()` for Auto-Cleanup

```ts
// ✅ Auto-cleanup on test teardown
const user = await db.seed({ table: 'users', data: { name: 'Test User' } });

// ❌ Manual insert requires manual cleanup
const user = await db.insert({ table: 'users', data: { name: 'Test User' } });
```

### ✅ NEVER Modify Shared/Production Data

Only insert, update, or delete test-specific data that your test created.

## Architecture

```
src/
├── models/database/
│   └── database.interface.ts     # DbQueryResult, DbSeedEntry, DbCleanupEntry
├── helpers/
│   └── database.helper.ts        # DatabaseHelper (query, seed, cleanup)
├── fixtures/
│   └── database-fixtures.ts      # db fixture (auto-cleanup + close)
```

## Configuration

Add database credentials to your `.env.*` files (see `manage-environments.md`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=secret
DB_SSL=false
```

Access via:

```ts
import { Config } from '@constants/config.constant';
Config.db.host;
Config.db.port;
Config.db.name;
```

## Instructions

### 1. Basic Usage — Seed and Auto-Cleanup

```ts
test('should display new user', async ({ db, signInPage }) => {
    // Arrange — seed inserts + queues for cleanup
    const user = await db.seed<{ id: string; email: string }>({
        table: 'users',
        data: {
            email: DataGenerator.randomEmail('test'),
            name: 'Test User',
            role: 'member',
            created_at: new Date().toISOString()
        }
    });

    // Act
    await signInPage.navigateToUsers();

    // Assert
    // ... verify user appears in UI

    // Cleanup happens automatically when db fixture tears down
});
```

### 2. Query — Read Data for Verification

```ts
test('should save form data to database', async ({ db, settingsPage }) => {
    // Act — user fills a form in the UI
    await settingsPage.updateCompanyName('New Corp');

    // Assert — verify in database
    const company = await db.findOne<{ name: string }>('companies', { id: companyId });
    expect(company?.name).toBe('New Corp');
});
```

### 3. Find Operations

```ts
// Single record
const user = await db.findOne<User>('users', { email: 'admin@test.com' });

// Multiple records
const activeUsers = await db.findMany<User>('users', { status: 'active' });

// Check existence
const exists = await db.exists('users', { email: 'test@test.com' });

// Count
const total = await db.count('users', { role: 'admin' });
const allUsers = await db.count('users');
```

### 4. Insert Without Auto-Cleanup

Use `insert()` when you handle cleanup yourself or the data is transient:

```ts
const token = await db.insert<{ id: string }>({
    table: 'tokens',
    data: { user_id: userId, value: 'abc123', expires_at: tomorrow }
});
```

### 5. Update and Delete

```ts
// Update
const affected = await db.update('users', { id: userId }, { name: 'Updated Name' });
expect(affected).toBe(1);

// Delete
const deleted = await db.delete('tokens', { user_id: userId });
```

### 6. Raw SQL

For complex queries, use `query()` directly:

```ts
const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users u
     JOIN organizations o ON u.org_id = o.id
     WHERE o.name = $1 AND u.role = $2`,
    ['Acme Corp', 'admin']
);
expect(Number(result.rows[0].count)).toBeGreaterThan(0);
```

### 7. Seed with Custom Returning

By default, `seed()` uses `RETURNING *`. Specify a column for the cleanup key:

```ts
const record = await db.seed({
    table: 'audit_logs',
    data: { action: 'test', user_id: userId },
    returning: 'id'
});
```

### 8. Manual Cleanup

If you need explicit cleanup order:

```ts
test('complex setup', async ({ db }) => {
    const org = await db.insert({ table: 'organizations', data: { name: 'Test Org' } });
    const user = await db.insert({ table: 'users', data: { org_id: org.id, name: 'User' } });

    // ... test logic ...

    // Manual cleanup in correct order (foreign keys)
    await db.delete('users', { id: user.id });
    await db.delete('organizations', { id: org.id });
});
```

## Test Patterns

### Pattern 1: Seed Before, Verify in UI

```ts
test('should show seeded data in table', async ({ db, dashboardPage, goto }) => {
    const item = await db.seed({
        table: 'items',
        data: { name: 'Seeded Item', status: 'active' }
    });

    await goto(Endpoints.dashboard);
    await expect(dashboardPage.main.table).toContainText('Seeded Item');
});
```

### Pattern 2: UI Action, Verify in DB

```ts
test('should persist form submission', async ({ db, formPage }) => {
    await formPage.submit({ name: 'New Entry', value: '42' });

    const entry = await db.findOne('entries', { name: 'New Entry' });
    expect(entry).not.toBeNull();
    expect(entry?.value).toBe('42');
});
```

### Pattern 3: Pre-condition Check

```ts
test('should only run if data exists', async ({ db }) => {
    const admin = await db.findOne('users', { role: 'superadmin' });
    test.skip(!admin, 'No superadmin in database');

    // ... test that requires superadmin ...
});
```

### Pattern 4: Bulk Seed

```ts
test('should paginate correctly', async ({ db, listPage }) => {
    const items = Array.from({ length: 25 }, (_, i) => ({
        table: 'items',
        data: { name: `Item ${i + 1}`, status: 'active' }
    }));

    for (const item of items) {
        await db.seed(item);
    }

    // ... verify pagination shows 20 per page ...
});
```

## Checklist

-   [ ] Uses `db` fixture from `@fixtures/fixtures`
-   [ ] Test data created with `seed()` for auto-cleanup
-   [ ] No hardcoded IDs — use returned values from `seed()`
-   [ ] No modification of shared/production data
-   [ ] Complex queries use parameterized `$1, $2` placeholders (no string interpolation)
-   [ ] Foreign key order respected in manual cleanup
-   [ ] Database credentials in `.env.*` files, not in code
