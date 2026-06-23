# Skill: Manage Test Data (Factories + Cleanup)

## When to Use

Use this skill when a test needs **state** to exist before it runs — a user, an organisation, an order, an uploaded file
— and that state must **not leak** into other tests.

Without this pattern you get:

-   Tests that pass alone but fail in parallel (data clashes)
-   Tests that pass the first run and fail the second (leftover state)
-   Tests that require manual DB cleanup
-   Slow CI because everyone seeds the same shared user

## Critical Rules

### ✅ Each test owns its data

-   Create what you need at test start; delete it at test end.
-   Never depend on data created by another test or a manual fixture.

### ✅ Use API, not UI, to set up data

-   API factories are 10×+ faster and don't depend on selectors.
-   Reach for UI setup only when testing the UI setup flow itself.

### ✅ Random unique values per test

-   Use `DataGenerator.randomEmail('feature-name')`, never a fixed string. Two parallel workers must never produce the
    same email.
-   For IDs you don't control, store them in a variable and use them for cleanup.

### ✅ Cleanup is mandatory and runs even on failure

-   Put cleanup in `test.afterEach`/fixture teardown, not at the end of the test body.
-   Failures during cleanup should **log + continue**, never block other cleanup.

### ✅ Cleanup is idempotent

-   If the test already deleted the entity, cleanup should swallow the 404 and move on.

## Pattern 1: Inline Factory + Cleanup (simplest)

For one-off needs in a single spec:

```ts
import { DataGenerator } from '@helpers/generate-data-functions';
import { ResponseHelper } from '@helpers/helper-functions';
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';

test.describe('Users', () => {
    let createdUserId: string | undefined;
    let token: string;

    test.beforeAll(async ({ apiCommands }) => {
        token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
    });

    test.afterEach(async ({ userService }) => {
        if (createdUserId) {
            await userService.deleteUser(token, createdUserId).catch(() => undefined);
            createdUserId = undefined;
        }
    });

    test('should display newly created user', async ({ userService, usersPage }) => {
        // Arrange — factory
        const userData = {
            name: DataGenerator.randomName(),
            email: DataGenerator.randomEmail('users-spec')
        };
        const { response } = await userService.createUser(token, userData);
        createdUserId = (await ResponseHelper.toJson<{ id: string }>(response)).id;

        // Act
        await BrowserInstance.currentPage.goto(Endpoints.app.users);

        // Assert
        const row = await usersPage.main.getUserByEmail(userData.email);
        await expect(row).toBeVisible();
    });
});
```

## Pattern 2: Factory Helper Class

When the same entity is created across many specs, extract a **factory** that returns the created data plus a cleanup
function.

`src/helpers/factories/user.factory.ts`:

```ts
import { Config } from '@constants/config.constant';
import { DataGenerator } from '@helpers/generate-data-functions';
import { ResponseHelper } from '@helpers/helper-functions';
import { UserService } from '@services/user.service';

export type CreatedUser = {
    id: string;
    email: string;
    name: string;
    cleanup: () => Promise<void>;
};

export class UserFactory {
    constructor(
        private readonly userService: UserService,
        private readonly token: string
    ) {}

    async create(overrides: Partial<{ email: string; name: string }> = {}): Promise<CreatedUser> {
        const payload = {
            name: overrides.name ?? DataGenerator.randomName(),
            email: overrides.email ?? DataGenerator.randomEmail('factory')
        };

        const { response } = await this.userService.createUser(this.token, payload);
        const { id } = await ResponseHelper.toJson<{ id: string }>(response);

        return {
            id,
            ...payload,
            cleanup: async () => {
                await this.userService.deleteUser(this.token, id).catch((err) => {
                    console.warn(`[UserFactory] cleanup failed for ${id}:`, err);
                });
            }
        };
    }
}
```

Usage:

```ts
test('should edit user name', async ({ userService, apiCommands, usersPage }) => {
    const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
    const factory = new UserFactory(userService, token);

    const user = await factory.create({ name: 'Old Name' });

    try {
        await usersPage.main.editUserName(user.email, 'New Name');
        await expect(usersPage.main.getUserNameCell(user.email)).toHaveText('New Name');
    } finally {
        await user.cleanup(); // ALWAYS runs
    }
});
```

## Pattern 3: Auto-Cleanup Fixture

The cleanest pattern: a fixture that **tracks** everything created during the test and deletes it on teardown. Tests
don't need `try/finally`.

`src/fixtures/data-fixtures.ts`:

```ts
import { Config } from '@constants/config.constant';
import { UserFactory, CreatedUser } from '@helpers/factories/user.factory';
import { UserService } from '@services/user.service';
import { ApiCommands } from '@commands/api-commands';
import { test as base } from '@playwright/test';

type DataFixtures = {
    userFactory: TrackedFactory<UserFactory['create']>;
};

type TrackedFactory<TFn extends (...args: any[]) => Promise<{ cleanup: () => Promise<void> }>> = TFn;

export const test = base.extend<DataFixtures>({
    userFactory: async ({}, use) => {
        const token = await new ApiCommands().getAuthorizationToken(Config.auth.superAdminEmail);
        const factory = new UserFactory(new UserService(), token);
        const created: CreatedUser[] = [];

        const trackedCreate: UserFactory['create'] = async (overrides) => {
            const user = await factory.create(overrides);
            created.push(user);
            return user;
        };

        await use(trackedCreate);

        // Teardown — cleanup ALL users created during the test, even on failure
        for (const user of created.reverse()) {
            await user.cleanup();
        }
    }
});
```

Register in `src/fixtures/fixtures.ts`:

```ts
export const test = mergeTests(
    serviceFixtures,
    commandFixtures,
    pageFixtures,
    dataFixtures, // ← add
    hookFixtures
);
```

Usage — tests just consume the fixture, no manual cleanup:

```ts
test('should list two new users', async ({ userFactory, usersPage }) => {
    const alice = await userFactory({ name: 'Alice' });
    const bob = await userFactory({ name: 'Bob' });

    await BrowserInstance.currentPage.goto(Endpoints.app.users);

    await expect(await usersPage.main.getUserByEmail(alice.email)).toBeVisible();
    await expect(await usersPage.main.getUserByEmail(bob.email)).toBeVisible();
    // No cleanup code — fixture handles it
});
```

## Pattern 4: Worker-Scoped Shared Data

For data that's truly read-only across the whole worker (e.g. a baseline tenant), use a **worker-scoped** fixture.
Created once per worker, torn down at the end.

```ts
export const test = base.extend<{}, { sharedOrg: SharedOrg }>({
    sharedOrg: [
        async ({}, use) => {
            const org = await createOrg();
            await use(org);
            await org.cleanup();
        },
        { scope: 'worker' }
    ]
});
```

> ⚠️ Only use worker scope when **no test mutates the data**. If any test edits it, you're back to per-test isolation.

## Naming and Storage

-   Factories live under `src/helpers/factories/<entity>.factory.ts`
-   Mock fixture JSON lives under `src/data/mocks/<feature>/` (see [`mock-network.md`](./mock-network.md))
-   Static reference data lives under `src/data/<feature>.json`
-   Random email prefixes name the **factory** or **spec**, never the human (`DataGenerator.randomEmail('users-spec')`,
    not `DataGenerator.randomEmail('john')`) — makes failed-cleanup orphans grep-able in the test environment.

## Parallel Safety Checklist

Before turning on `fullyParallel: true` and multiple workers, verify each test:

-   [ ] Creates its own data with unique random values
-   [ ] Doesn't depend on a fixed user/org/tenant other tests might be modifying
-   [ ] Cleans up everything it created
-   [ ] Doesn't read or write a global counter, sequence, or shared file

## Anti-Patterns

### ❌ Pre-seeded shared user

"Use `test-user-1@example.com` for all your tests." → guaranteed flakes the moment two tests run in parallel and one of
them edits this user.

### ❌ Cleanup in the test body

```ts
// Bad — skipped on failure
test('...', async () => {
    const user = await create();
    await doStuff(user);
    await deleteUser(user.id); // never runs if doStuff throws
});
```

### ❌ Hardcoded random seeds

```ts
const email = `user-${Date.now()}@example.com`; // collides under parallelism
```

Use `DataGenerator.randomEmail(prefix)` which already adds a unique component.

### ❌ Leaving cleanup until "later"

Orphaned test data accumulates → test DB grows → slow queries → flaky tests → blamed on "environment issues". Clean up
now.

## Related

-   [Mock Network](./mock-network.md) — pair with mocking to test edge cases without backend setup
-   [Use Auth State](./use-auth-state.md) — get a token cheaply for factory calls
-   `src/helpers/generate-data-functions.ts` — `DataGenerator` (random emails, names, etc.)
-   `src/commands/api-commands.ts` — `getAuthorizationToken` for factory auth
