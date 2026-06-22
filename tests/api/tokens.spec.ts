import { SUPER_ADMIN_EMAIL } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';
import { ArrayHelper } from '@helpers/helper-functions';
import { validateJsonSchema } from '@helpers/validate-schema.helper';
import { StatusCodes } from 'http-status-codes';

test.describe('Tokens Service', () => {
    let authorizationToken: string;

    const schemaFolder = 'tokens';

    test.beforeAll(async ({ apiCommands }) => {
        authorizationToken = await apiCommands.getAuthorizationToken(SUPER_ADMIN_EMAIL);
    });

    test('GET /tokens', async ({ tokensService }) => {
        tokensService.setToken(authorizationToken);

        await tokensService.create({ name: DataGenerator.randomString() });
        const { statusCode, data } = await tokensService.getAll();

        expect(statusCode).toEqual(StatusCodes.OK);
        await validateJsonSchema('GET_tokens', schemaFolder, data);
    });

    test('DELETE /tokens/{id}', async ({ tokensService }) => {
        tokensService.setToken(authorizationToken);

        await tokensService.create({ name: DataGenerator.randomString() });
        const { data: tokens } = await tokensService.getAll();
        const { statusCode } = await tokensService.deleteById(tokens[0].id);

        expect(statusCode).toEqual(StatusCodes.NO_CONTENT);
    });

    test.afterEach(async ({ tokensService }) => {
        tokensService.setToken(authorizationToken);

        const { data: tokens } = await tokensService.getAll();
        await ArrayHelper.forEachSync(tokens, async ({ id }) => {
            await tokensService.deleteById(id);
        });
    });
});
