import { BrowserInstance } from '@common/browser';
import { DOWNLOADS_PATH } from '@constants/common.constant';
import { type Clickable } from '@elements/base/clickable';
import { PdfHelper } from '@helpers/pdf.helper';
import { type Download } from '@playwright/test';
import { test as base } from '@playwright/test';

type PdfFixtures = {
    downloadPdf: (trigger: Clickable) => Promise<PdfHelper>;
    getPdfFromResponse: (url: string | RegExp) => Promise<PdfHelper>;
};

export const test = base.extend<PdfFixtures>({
    downloadPdf: async ({}, use) => {
        const downloadPdfFn = async (trigger: Clickable): Promise<PdfHelper> => {
            const page = BrowserInstance.currentPage;
            const downloadPromise: Promise<Download> = page.waitForEvent('download');
            await trigger.click();
            const download = await downloadPromise;
            const filePath = DOWNLOADS_PATH + download.suggestedFilename();
            await download.saveAs(filePath);
            return PdfHelper.open(download.suggestedFilename());
        };

        await use(downloadPdfFn);
    },

    getPdfFromResponse: async ({}, use) => {
        const getPdfFromResponseFn = async (url: string | RegExp): Promise<PdfHelper> => {
            const page = BrowserInstance.currentPage;
            const response = await page.waitForResponse(url);
            const buffer = await response.body();
            return PdfHelper.fromBuffer(buffer);
        };

        await use(getPdfFromResponseFn);
    }
});
