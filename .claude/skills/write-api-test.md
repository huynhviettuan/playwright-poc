# Skill: Write API Test

## When to Use
Use this skill when creating a new API test case.

## Critical Rules

### ✅ ALWAYS Use Custom Fixtures
```ts
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER: import { expect, test } from '@playwright/test';
```

### ✅ Follow SOLID Principles
- Service classes should have single responsibility
- Use BaseService for common API operations
- Extract complex response validation into helper functions

### ✅ Clean Code Practices
- Use descriptive variable names
- Extract magic numbers into constants
- Use StatusCodes enum instead of raw numbers
- Keep test logic clear and readable

## Instructions

1. **Create test file** in `tests/api/[feature]/[test-name].spec.ts`:
   ```ts
   import { expect, test } from '@fixtures/fixtures';
   import { StatusCodes } from 'http-status-codes';
   
   test.describe('API - [Feature Name]', () => {
       let token: string;
       
       test.beforeAll(async ({ tokensService }) => {
           const response = await tokensService.getToken();
           token = await response.response.json().then(r => r.token);
       });
       
       test('[Test description]', async ({ userService }) => {
           // Arrange
           const userId = '123';
           
           // Act
           const { statusCode, response } = await userService.getUser(token, userId);
           
           // Assert
           expect(statusCode).toBe(StatusCodes.OK);
           const data = await response.json();
           expect(data).toHaveProperty('id', userId);
       });
   });
   ```

2. **Use StatusCodes enum** from `http-status-codes`:
   ```ts
   StatusCodes.OK              // 200
   StatusCodes.CREATED         // 201
   StatusCodes.BAD_REQUEST     // 400
   StatusCodes.UNAUTHORIZED    // 401
   StatusCodes.NOT_FOUND       // 404
   ```

3. **Response Handling**:
   ```ts
   import { ResponseHelper } from '@helpers/helper-functions';
   const data = await ResponseHelper.toJson<User>(response);
   ```

## Common Patterns

### Create and Verify Resource
```ts
// Create
const createResponse = await service.createUser(token, userData);
expect(createResponse.statusCode).toBe(StatusCodes.CREATED);
const userId = await createResponse.response.json().then(r => r.id);

// Verify
const getResponse = await service.getUser(token, userId);
expect(getResponse.statusCode).toBe(StatusCodes.OK);
const user = await getResponse.response.json();
expect(user.email).toBe(userData.email);
```

### Schema Validation
```ts
import { validateSchema } from '@helpers/validate-schema.helper';
const data = await response.response.json();
const isValid = await validateSchema(data, expectedSchema);
expect(isValid).toBeTruthy();
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

## Clean Code Example

### ❌ Bad - Magic numbers, unclear logic
```ts
test('test user', async ({ service }) => {
    const r = await service.get('123');
    expect(r.statusCode).toBe(200);
    const d = await r.response.json();
    expect(d.status).toBe(1);
});
```

### ✅ Good - Clear, descriptive, uses constants
```ts
test('should return active user when user exists', async ({ userService }) => {
    // Arrange
    const userId = '123';
    const expectedStatus = 'active';
    
    // Act
    const { statusCode, response } = await userService.getUser(token, userId);
    
    // Assert
    expect(statusCode).toBe(StatusCodes.OK);
    const user = await response.json();
    expect(user.status).toBe(expectedStatus);
});
```
