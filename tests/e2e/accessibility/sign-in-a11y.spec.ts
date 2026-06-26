import { BrowserInstance } from '@common/browser';
import { Config } from '@constants/config.constant';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';
import { AccessibilityHelper } from '@helpers/accessibility.helper';

test.describe('Sign In — Accessibility', () => {
    test.beforeEach(async ({ goto }) => {
        await goto(Endpoints.auth.signIn);
    });

    test('TC-SI-A11Y-001 — sign in page should have no critical violations', async ({ a11y }) => {
        const results = await a11y.scan();
        const critical = AccessibilityHelper.filterByImpact(results, 'serious');

        expect(critical).toHaveLength(0);
    });

    test('TC-SI-A11Y-002 — sign in page should meet WCAG 2.1 AA', async ({ a11y }) => {
        const results = await a11y.scan({ includeTags: ['wcag21aa', 'wcag2aa'] });

        expect(results.violations).toHaveLength(0);
    });

    test('TC-SI-A11Y-003 — sign in form should be accessible in isolation', async ({ a11y }) => {
        const results = await a11y.scan({ include: ['form'] });

        expect(results.violations).toHaveLength(0);
    });

    test('TC-SI-A11Y-004 — error state should remain accessible', async ({ signInPage, a11y }) => {
        await signInPage.main.btnLogin.click();
        await BrowserInstance.currentPage.waitForLoadState('domcontentloaded');

        const results = await a11y.scan();
        const critical = AccessibilityHelper.filterByImpact(results, 'serious');

        expect(critical).toHaveLength(0);
    });

    test('TC-SI-A11Y-005 — authenticated page should have no critical violations', async ({ signInPage, a11y }) => {
        await signInPage.signIn(Config.auth.superAdminEmail);
        await expect(BrowserInstance.currentPage).not.toHaveURL(new RegExp(Endpoints.auth.signIn));

        const results = await a11y.scan();
        const critical = AccessibilityHelper.filterByImpact(results, 'serious');

        expect(critical).toHaveLength(0);
    });
});
