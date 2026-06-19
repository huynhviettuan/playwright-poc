import { SUPER_ADMIN_EMAIL } from '@constants/config.constant';
import { ENDPOINTS } from '@constants/endpoints.constant';
import { NotificationMessages } from '@constants/messages.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Login', async () => {
    test.beforeEach(async ({ goto }) => {
        await goto(ENDPOINTS.SIGN_IN);
    });

    test('Verify that user is able to login with an existed account in DB', async ({ signInPage }) => {
        await signInPage.signIn(SUPER_ADMIN_EMAIL);
        await Promise.all([
            expect(await signInPage.toast.getMessage()).toEqual(NotificationMessages.auth.loginSuccess),
            expect(signInPage.main.txtEmail).toBeHidden()
        ]);
    });
});
