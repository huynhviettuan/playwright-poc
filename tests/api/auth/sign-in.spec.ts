import { Config } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';
import { ResponseHelper } from '@helpers/helper-functions';
import { validateJsonSchema } from '@helpers/validate-schema.helper';
import { SignInResponse } from '@models/auth/user-organization.interface';
import { StatusCodes } from 'http-status-codes';

/**
 * API coverage for POST /user-organization/auth/signin.
 * Test cases: docs/test-cases/sign-in.md
 *
 * VERIFY ON FIRST RUN:
 *   - Exact success status (200 vs 201)
 *   - Validation error status (400 vs 422)
 *   - Response shape — update `SignInResponse` and the schema if it differs
 */
test.describe('API — POST /user-organization/auth/signin', () => {
    const schemaFolder = 'auth';

    test('TC-SI-API-001 — valid credentials return token', async ({ userOrganizationService }) => {
        const { statusCode, response } = await userOrganizationService.signIn({
            email: Config.auth.superAdminEmail,
            password: Config.auth.password
        });

        const body = await ResponseHelper.toJson<SignInResponse>({ response });

        await Promise.all([
            expect(statusCode).toEqual(StatusCodes.OK),
            expect(body.token).toBeTruthy(),
            validateJsonSchema('POST_signin', schemaFolder, body)
        ]);
    });

    test('TC-SI-API-002 — wrong password returns 401', async ({ userOrganizationService }) => {
        const { statusCode, response } = await userOrganizationService.signIn({
            email: Config.auth.superAdminEmail,
            password: 'WrongPassword!'
        });

        const body = await ResponseHelper.toJson<{ token?: string }>({ response });

        await Promise.all([
            expect(statusCode).toEqual(StatusCodes.UNAUTHORIZED),
            expect(body.token).toBeFalsy()
        ]);
    });

    test('TC-SI-API-003 — non-existent email returns 401 (no user enumeration)', async ({
        userOrganizationService
    }) => {
        const { statusCode } = await userOrganizationService.signIn({
            email: DataGenerator.randomEmail('does-not-exist'),
            password: 'AnyPassword1!'
        });

        // Must be the same status code as wrong-password — different codes leak whether the email exists.
        expect(statusCode).toEqual(StatusCodes.UNAUTHORIZED);
    });

    test('TC-SI-API-004 — missing email returns 400', async ({ userOrganizationService }) => {
        const { statusCode } = await userOrganizationService.signIn({
            password: Config.auth.password
        } as unknown as Parameters<typeof userOrganizationService.signIn>[0]);

        expect(statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test('TC-SI-API-005 — missing password returns 400', async ({ userOrganizationService }) => {
        const { statusCode } = await userOrganizationService.signIn({
            email: Config.auth.superAdminEmail
        } as unknown as Parameters<typeof userOrganizationService.signIn>[0]);

        expect(statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test('TC-SI-API-006 — malformed email returns 400', async ({ userOrganizationService }) => {
        const { statusCode } = await userOrganizationService.signIn({
            email: 'not-an-email',
            password: Config.auth.password
        });

        expect(statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    test('TC-SI-API-007 — empty body returns 400', async ({ userOrganizationService }) => {
        const { statusCode } = await userOrganizationService.signIn(
            {} as unknown as Parameters<typeof userOrganizationService.signIn>[0]
        );

        expect(statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
});
