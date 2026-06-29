import { BrowserInstance } from '@common/browser';
import { DOWNLOADS_PATH } from '@constants/common.constant';
import { type Clickable } from '@elements/base/clickable';
import { WordHelper } from '@helpers/word.helper';
import { type Download } from '@playwright/test';
import { test as base } from '@playwright/test';

type WordFixtures = {
    downloadWord: (trigger: Clickable) => Promise<WordHelper>;
    getWordFromResponse: (url: string | RegExp) => Promise<WordHelper>;
};

export const test = base.extend<WordFixtures>({
    downloadWord: async ({}, use) => {
        const downloadWordFn = async (trigger: Clickable): Promise<WordHelper> => {
            const page = BrowserInstance.currentPage;
            const downloadPromise: Promise<Download> = page.waitForEvent('download');
            await trigger.click();
            const download = await downloadPromise;
            const filePath = DOWNLOADS_PATH + download.suggestedFilename();
            await download.saveAs(filePath);
            return WordHelper.open(download.suggestedFilename());
        };

        await use(downloadWordFn);
    },

    getWordFromResponse: async ({}, use) => {
        const getWordFromResponseFn = async (url: string | RegExp): Promise<WordHelper> => {
            const page = BrowserInstance.currentPage;
            const response = await page.waitForResponse(url);
            const buffer = await response.body();
            return WordHelper.fromBuffer(buffer);
        };

        await use(getWordFromResponseFn);
    }
});
