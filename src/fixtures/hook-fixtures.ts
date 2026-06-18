import { BrowserInstance } from '@common/browser';
import { Page, Response, test as base } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export { expect } from '@playwright/test';

const downloadDir: string = join('src', 'downloads');

type WrappedFixtures = {
    baseURL: string | undefined;
    isMobile?: boolean;
    page: Page;
};

type GoToOptions = {
    referer?: string | undefined;
    timeout?: number | undefined;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' | undefined;
};

export const test = base.extend<
    {
        goto: (endpoint?: string, options?: GoToOptions) => Promise<null | Response>;
        initBrowserInstance: void;
    },
    { autoWorkerFixture: string }
>({
    goto: [
        async (
            {},
            use: (func: (endpoint?: string, options?: GoToOptions) => Promise<null | Response>) => Promise<void>
        ) => {
            await use((endpoint = '/', options?: GoToOptions) => BrowserInstance.currentPage.goto(endpoint, options));
        },
        { scope: 'test' }
    ],
    initBrowserInstance: [
        async ({ isMobile, page }: WrappedFixtures, use: () => Promise<void>) => {
            // Using BrowserInstance's `withPage` to assign page and set context mobile status
            BrowserInstance.withPage(page);
            BrowserInstance.isContextMobile = Boolean(isMobile);
            await use();
            // Reset the page and context after the test
            BrowserInstance.currentPage = undefined;
            BrowserInstance.currentContext = undefined;
            BrowserInstance.browser = undefined;
        },
        { scope: 'test', auto: true }
    ],
    autoWorkerFixture: [
        async ({}, use) => {
            // Setup browser and init page
            await BrowserInstance.start();
            const beforePage: Page = await BrowserInstance.startNewPage();
            await beforeHooks();
            await closePage(beforePage);
            await use('autoWorkerFixture');
        },
        { scope: 'worker', auto: true }
    ]
});

// 🔧 Updated to use `BrowserInstance.startNewPage()` (handled by BrowserInstance)
const closePage: (page: Page) => Promise<void> = async (page: Page): Promise<void> => {
    await page.close();
    BrowserInstance.currentPage = undefined;
    BrowserInstance.currentContext = undefined;
    BrowserInstance.browser = undefined;
};

const beforeHooks: () => Promise<void> = async (): Promise<void> => {
    createDownloadsFolder();
};

const createDownloadsFolder: () => void = () => {
    if (!existsSync(downloadDir)) {
        mkdirSync(downloadDir);
    }
};
