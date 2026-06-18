import { BrowserInstance } from '@common/browser';
import { SUPER_ADMIN_EMAIL } from '@constants/config.constant';
import { ENDPOINTS } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Login', async () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(ENDPOINTS.SIGN_IN);
    });

    test('Verify that user is able to login with an existed account in DB', async ({ signInPage }) => {
        await signInPage.signIn(SUPER_ADMIN_EMAIL);
        await Promise.all([expect(await signInPage.toast.getMessage()).toEqual('Login successful')]);
    });
});
