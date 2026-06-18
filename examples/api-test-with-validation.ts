import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';

/**
 * API Test with Validation Example
 * 
 * Shows how to:
 * - Use service fixtures
 * - Handle authentication
 * - Validate response status and schema
 */

test.describe('Example: API Test with Validation', () => {
    let token: string;

    test.beforeAll(async ({ tokensService }) => {
        const response = await tokensService.getToken();
        token = await response.response.json().then(r => r.token);
    });

    test('should get user data with valid schema', async ({ userService }) => {
        // Act
        const { statusCode, response } = await userService.getUser(token, '123');
        
        // Assert
        expect(statusCode).toBe(StatusCodes.OK);
        
        const user = await response.json();
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
    });
});
