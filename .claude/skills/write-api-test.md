# Skill: Write API Test

## When to Use

Use this skill when creating a new API test case.

## Critical Rules

### ✅ ALWAYS Use Custom Fixtures

```ts
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER: import { expect, test } from '@playwright/test';
```

### ✅ Use Controller Pattern Services

-   Services follow the controller pattern — one class per Swagger tag
-   Set token once via `service.setToken(token)`, not per method
-   Methods return `ServiceResponse<T>` with typed `data` — no manual JSON parsing

### ✅ Follow SOLID Principles

-   Service classes should have single responsibility
-   Use BaseService for common API operations
-   Extract complex response validation into helper functions

### ✅ Clean Code Practices

-   Use descriptive variable names
-   Extract magic numbers into constants
-   Use StatusCodes enum instead of raw numbers
-   Keep test logic clear and readable

## Instructions

1. **Create test file** in `tests/api/[feature]/[test-name].spec.ts`:

    ```ts
    import { expect, test } from '@fixtures/fixtures';
    import { StatusCodes } from 'http-status-codes';

    test.describe('API - [Feature Name]', () => {
        let token: string;

        test.beforeAll(async ({ apiCommands }) => {
            token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
        });

        test('[Test description]', async ({ usersService }) => {
            // Arrange
            usersService.setToken(token);
            const userId = '123';

            // Act
            const { statusCode, data } = await usersService.getById(userId);

            // Assert
            expect(statusCode).toBe(StatusCodes.OK);
            expect(data.id).toBe(userId);
        });
    });
    ```

2. **Use StatusCodes enum** from `http-status-codes`:

    ```ts
    StatusCodes.OK; // 200
    StatusCodes.CREATED; // 201
    StatusCodes.NO_CONTENT; // 204
    StatusCodes.BAD_REQUEST; // 400
    StatusCodes.UNAUTHORIZED; // 401
    StatusCodes.NOT_FOUND; // 404
    ```

3. **Response handling** — `send<T>()` returns typed data directly:

    ```ts
    // ✅ New — data is already typed
    const { statusCode, data } = await usersService.getById(id);
    expect(data.email).toBe(expected);

    // ❌ Old — manual parsing (avoid in new code)
    const { statusCode, response } = await service.get({ id });
    const data = await ResponseHelper.toJson<User>({ response });
    ```

## Common Patterns

### Create and Verify Resource

```ts
test('should create and retrieve user', async ({ usersService, apiCommands }) => {
    const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
    usersService.setToken(token);

    // Create
    const { statusCode: createStatus, data: created } = await usersService.create({
        name: DataGenerator.randomName(),
        email: DataGenerator.randomEmail('api-test')
    });
    expect(createStatus).toBe(StatusCodes.CREATED);

    // Verify
    const { statusCode, data } = await usersService.getById(created.id);
    expect(statusCode).toBe(StatusCodes.OK);
    expect(data.email).toBe(created.email);
});
```

### Schema Validation

```ts
import { validateJsonSchema } from '@helpers/validate-schema.helper';

const { data } = await usersService.getAll();
await validateJsonSchema('GET_users', 'users', data);
```

### Generate Test Data

```ts
import { DataGenerator } from '@helpers/generate-data-functions';

const testUser = {
    name: DataGenerator.randomName(),
    email: DataGenerator.randomEmail('api-test'),
    phone: DataGenerator.randomPhone()
};
```

### Cleanup in afterEach

```ts
test.afterEach(async ({ tokensService }) => {
    tokensService.setToken(authorizationToken);
    const { data: tokens } = await tokensService.getAll();
    await ArrayHelper.forEachSync(tokens, async ({ id }) => {
        await tokensService.deleteById(id);
    });
});
```

## Clean Code Example

### ❌ Bad - Magic numbers, token per method, manual parsing

```ts
test('test user', async ({ service }) => {
    const r = await service.getUser(token, '123');
    expect(r.statusCode).toBe(200);
    const d = await r.response.json();
    expect(d.status).toBe(1);
});
```

### ✅ Good - Clear, descriptive, controller pattern

```ts
test('should return active user when user exists', async ({ usersService, apiCommands }) => {
    // Arrange
    const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
    usersService.setToken(token);
    const userId = '123';

    // Act
    const { statusCode, data } = await usersService.getById(userId);

    // Assert
    expect(statusCode).toBe(StatusCodes.OK);
    expect(data.status).toBe('active');
});
```
