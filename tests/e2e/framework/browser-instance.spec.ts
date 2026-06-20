import { BrowserInstance, usePage } from '@common/browser';
import { expect, test } from '@fixtures/fixtures';

test.describe('BrowserInstance — sequential per-test isolation', () => {
    test('currentPage is the same reference as the page fixture', async ({ page }) => {
        expect(BrowserInstance.currentPage).toBe(page);
    });

    test('test A writes its title and reads its own page', async () => {
        await BrowserInstance.currentPage.goto('about:blank');
        await BrowserInstance.currentPage.evaluate(() => {
            document.title = 'page-A';
        });
        await expect(BrowserInstance.currentPage).toHaveTitle('page-A');
        await new Promise((r) => setTimeout(r, 25));
        await expect(BrowserInstance.currentPage).toHaveTitle('page-A');
    });

    test('test B sees a fresh page — no bleed from test A', async () => {
        await expect(BrowserInstance.currentPage).not.toHaveTitle('page-A');
        await BrowserInstance.currentPage.goto('about:blank');
        await BrowserInstance.currentPage.evaluate(() => {
            document.title = 'page-B';
        });
        await expect(BrowserInstance.currentPage).toHaveTitle('page-B');
    });

    test('usePage overrides currentPage for the duration of the callback', async ({ browser }) => {
        const outer = BrowserInstance.currentPage;
        await outer.goto('about:blank');
        await outer.evaluate(() => { document.title = 'outer'; });

        const newCtx = await browser.newContext();
        const aliasPage = await newCtx.newPage();
        await aliasPage.goto('about:blank');
        await aliasPage.evaluate(() => { document.title = 'alias'; });

        await usePage(aliasPage, async () => {
            expect(BrowserInstance.currentPage).toBe(aliasPage);
            await expect(BrowserInstance.currentPage).toHaveTitle('alias');
        });

        expect(BrowserInstance.currentPage).toBe(outer);
        await expect(BrowserInstance.currentPage).toHaveTitle('outer');
        await newCtx.close();
    });

    test('isContextMobile returns false for the chrome project', async () => {
        expect(BrowserInstance.isContextMobile).toBe(false);
    });
});
