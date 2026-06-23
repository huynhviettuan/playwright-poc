# API Test with Validation Example

Example of API testing with response validation and schema checking.

## Code

```typescript
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';
import { ResponseHelper } from '@helpers/helper-functions';
import { validateSchema } from '@helpers/validate-schema.helper';
import userSchema from '@data/schemas/user.schema.json';

test.describe('API - Users', () => {
    let token: string;

    test.beforeAll(async ({ tokensService }) => {
        const response = await tokensService.getToken();
        token = await ResponseHelper.toJson(response).then((r) => r.token);
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

    test('should validate user schema', async ({ userService }) => {
        // Act
        const { response } = await userService.getUser(token, '123');
        const user = await response.json();

        // Assert - Schema validation
        const isValid = await validateSchema(user, userSchema);
        expect(isValid).toBeTruthy();
    });
});
```

## Key Points

-   ✅ Use `StatusCodes` enum for status codes
-   ✅ Use `ResponseHelper.toJson()` for response parsing
-   ✅ Use `validateSchema()` for JSON schema validation
-   ✅ Store token in `beforeAll` to reuse across tests
-   ✅ Always check status code before parsing response

## Related

-   [Write API Test Skill](../../.claude/skills/write-api-test.md)
-   [Create API Service Skill](../../.claude/skills/create-api-service.md)
