import { SUPER_ADMIN_EMAIL } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { generateRandomString } from '@helpers/generate-data-functions';
import { fetchJsonResponse, resolveAll, syncForEach } from '@helpers/helper-functions';
import { validateJsonSchema } from '@helpers/validate-schema.helper';
import { StatusCodes } from 'http-status-codes';

test.describe('Tokens Service', async () => {
    let authorizationToken: string;

    const schemaFolder = 'tokens';

    test.beforeAll(async ({ apiCommands }) => {
        authorizationToken = await apiCommands.getAuthorizationToken(SUPER_ADMIN_EMAIL);
    });

    test('GET /tokens', async ({ tokensService }) => {
        await tokensService.postTokens(authorizationToken, {
            name: generateRandomString()
        });
        const { statusCode, response } = await tokensService.getTokens(authorizationToken);
        await resolveAll([
            expect(statusCode).toEqual(StatusCodes.OK),
            validateJsonSchema('GET_tokens', schemaFolder, await fetchJsonResponse({ response }))
        ]);
    });

    test('DELETE /tokens/{id}', async ({ tokensService }) => {
        await tokensService.postTokens(authorizationToken, {
            name: generateRandomString()
        });
        const { statusCode } = await tokensService.deleteTokens(
            authorizationToken,
            (await fetchJsonResponse(await tokensService.getTokens(authorizationToken)))[0].id
        );
        expect(statusCode).toEqual(StatusCodes.NO_CONTENT);
    });

    test.afterEach(async ({ tokensService }) => {
        await syncForEach(
            await fetchJsonResponse<{ id: string }[]>(await tokensService.getTokens(authorizationToken)),
            async ({ id }) => {
                await tokensService.deleteTokens(authorizationToken, id);
            }
        );
    });
});
