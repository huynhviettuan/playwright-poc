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
            BrowserInstance.withPage(page);
            BrowserInstance.isContextMobile = Boolean(isMobile);
            await use();
            BrowserInstance.currentPage = undefined;
            BrowserInstance.currentContext = undefined;
            BrowserInstance.browser = undefined;
        },
        { scope: 'test', auto: true }
    ],
    autoWorkerFixture: [
        async ({}, use) => {
            if (!existsSync(downloadDir)) {
                mkdirSync(downloadDir);
            }
            await use('autoWorkerFixture');
        },
        { scope: 'worker', auto: true }
    ]
});
