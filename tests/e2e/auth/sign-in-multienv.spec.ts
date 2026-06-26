/* eslint-disable playwright/no-skipped-test */
import { BrowserInstance } from '@common/browser';
import { Config } from '@constants/config.constant';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Sign In — Environment-Specific', () => {
    test.beforeEach(async ({ goto }) => {
        await goto(Endpoints.auth.signIn);
    });

    test('TC-SI-ENV-001 — should load correct base URL for current environment', () => {
        const currentUrl = BrowserInstance.currentPage.url();
        expect(currentUrl).toContain(Config.app.baseUrl);
    });

    test('TC-SI-ENV-002 — should authenticate against correct API domain', async ({ signInPage }) => {
        const apiRequests: string[] = [];

        await BrowserInstance.currentPage.route('**/auth/**', (route) => {
            apiRequests.push(route.request().url());
            return route.continue();
        });

        await signInPage.signIn(Config.auth.superAdminEmail);

        const authRequest = apiRequests.find((url) => url.includes('auth'));
        expect(authRequest).toContain(Config.api.domain);
    });

    test.describe('Production safety', () => {
        test.skip(Config.env !== 'production', 'Only runs in production');

        test('TC-SI-ENV-003 — should not expose debug information in production', async ({ signInPage }) => {
            await signInPage.signIn('invalid@test.com', 'wrong');

            const pageContent = await BrowserInstance.currentPage.content();
            expect(pageContent).not.toContain('stack trace');
            expect(pageContent).not.toContain('Error:');
        });
    });

    test.describe('Non-production', () => {
        test.skip(() => Config.env === 'production', 'Skip destructive tests in production');

        test('TC-SI-ENV-004 — should allow test account login in non-prod', async ({ signInPage }) => {
            await signInPage.signIn(Config.auth.superAdminEmail);
            await expect(BrowserInstance.currentPage).not.toHaveURL(new RegExp(Endpoints.auth.signIn));
        });
    });
});
