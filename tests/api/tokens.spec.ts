import { SUPER_ADMIN_EMAIL } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';
import { ArrayHelper, ResponseHelper } from '@helpers/helper-functions';
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
            name: DataGenerator.randomString()
        });
        const { statusCode, response } = await tokensService.getTokens(authorizationToken);
        await Promise.all([
            expect(statusCode).toEqual(StatusCodes.OK),
            validateJsonSchema('GET_tokens', schemaFolder, await ResponseHelper.toJson({ response }))
        ]);
    });

    test('DELETE /tokens/{id}', async ({ tokensService }) => {
        await tokensService.postTokens(authorizationToken, {
            name: DataGenerator.randomString()
        });
        const { statusCode } = await tokensService.deleteTokens(
            authorizationToken,
            (await ResponseHelper.toJson(await tokensService.getTokens(authorizationToken)))[0].id
        );
        expect(statusCode).toEqual(StatusCodes.NO_CONTENT);
    });

    test.afterEach(async ({ tokensService }) => {
        await ArrayHelper.forEachSync(
            await ResponseHelper.toJson<{ id: string }[]>(await tokensService.getTokens(authorizationToken)),
            async ({ id }) => {
                await tokensService.deleteTokens(authorizationToken, id);
            }
        );
    });
});
