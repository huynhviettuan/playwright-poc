import { BrowserInstance } from '@common/browser';
import { Config } from '@constants/config.constant';
import { Endpoints } from '@constants/endpoints.constant';
import { NotificationMessages } from '@constants/messages.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';

/**
 * E2E coverage for the sign-in flow.
 * Test cases: docs/test-cases/sign-in.md
 *
 * All user-facing messages (success, error, validation) are read from the centralized
 * `Toast` component on the page — see docs/guidance/notifications.md.
 *
 * VERIFY ON FIRST RUN:
 *   - Exact toast/message strings vs NotificationMessages copy
 *   - Post-login redirect target
 */
test.describe('Sign In', () => {
    test.beforeEach(async ({ goto }) => {
        await goto(Endpoints.auth.signIn);
    });

    test('TC-SI-E2E-001 — should sign in with valid credentials', async ({ signInPage }) => {
        await signInPage.signIn(Config.auth.superAdminEmail);

        await Promise.all([
            expect(signInPage.main.txtEmail).toBeHidden(),
            expect(signInPage.main.txtPassword).toBeHidden()
        ]);
        await expect(BrowserInstance.currentPage).not.toHaveURL(new RegExp(Endpoints.auth.signIn));
    });

    test('TC-SI-E2E-002 — should reject wrong password', async ({ signInPage }) => {
        await signInPage.signIn(Config.auth.superAdminEmail, 'WrongPassword!');

        await expect(BrowserInstance.currentPage).toHaveURL(new RegExp(Endpoints.auth.signIn));
        expect(await signInPage.toast.getMessage()).toContain(NotificationMessages.auth.loginFailed);
    });

    test('TC-SI-E2E-003 — should reject non-existent email with generic error', async ({ signInPage }) => {
        const randomEmail = DataGenerator.randomEmail('does-not-exist');

        await signInPage.signIn(randomEmail, 'AnyPassword1!');

        // Security: same message as wrong-password — different copy would enumerate users.
        await expect(BrowserInstance.currentPage).toHaveURL(new RegExp(Endpoints.auth.signIn));
        expect(await signInPage.toast.getMessage()).toContain(NotificationMessages.auth.loginFailed);
    });

    test('TC-SI-E2E-004 — should require email', async ({ signInPage }) => {
        await signInPage.main.txtPassword.fill(Config.auth.password);
        await signInPage.main.btnLogin.click();

        await expect(BrowserInstance.currentPage).toHaveURL(new RegExp(Endpoints.auth.signIn));
        expect(await signInPage.toast.getMessage()).toContain(NotificationMessages.validation.required);
    });

    test('TC-SI-E2E-005 — should require password', async ({ signInPage }) => {
        await signInPage.main.txtEmail.fill(Config.auth.superAdminEmail);
        await signInPage.main.btnLogin.click();

        await expect(BrowserInstance.currentPage).toHaveURL(new RegExp(Endpoints.auth.signIn));
        expect(await signInPage.toast.getMessage()).toContain(NotificationMessages.validation.required);
    });

    test('TC-SI-E2E-006 — should reject malformed email', async ({ signInPage }) => {
        await signInPage.signIn('not-an-email', Config.auth.password);

        await expect(BrowserInstance.currentPage).toHaveURL(new RegExp(Endpoints.auth.signIn));
        expect(await signInPage.toast.getMessage()).toContain(NotificationMessages.validation.invalidEmail);
    });

    test('TC-SI-E2E-007 — should navigate to forgot password', async ({ signInPage }) => {
        await signInPage.goToForgotPassword();

        await expect(BrowserInstance.currentPage).toHaveURL(new RegExp(Endpoints.auth.forgotPassword));
    });

    test('TC-SI-E2E-008 — password field should be masked', async ({ signInPage }) => {
        await signInPage.main.txtPassword.fill('secret');

        expect(await signInPage.main.txtPassword.getAttribute('type')).toBe('password');
    });
});
