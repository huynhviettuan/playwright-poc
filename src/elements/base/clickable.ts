import { BrowserInstance } from '@common/browser';
import { DOWNLOADS_PATH, LONG_TIMEOUT } from '@constants/common.constant';
import { IClickable } from '@models/elements/clickable.interface';
import { Download, Locator } from '@playwright/test';
import { BaseControl } from './base-control';

export class Clickable extends BaseControl implements IClickable {
    constructor(locator?: Locator) {
        super(locator);
    }

    async click(options?: {
        button?: 'left' | 'right' | 'middle';
        clickCount?: number;
        delay?: number;
        force?: boolean;
        modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
        noWaitAfter?: boolean;
        position?: {
            x: number;
            y: number;
        };
        timeout?: number;
        trial?: boolean;
    }): Promise<void> {
        await this.element.click(options);
    }

    async doubleClick(): Promise<void> {
        await this.element.dblclick();
    }

    async hover(): Promise<void> {
        await this.element.hover();
    }

    async download(timeout: number = LONG_TIMEOUT): Promise<string> {
        const downloadPromise: Promise<Download> = BrowserInstance.currentPage.waitForEvent('download', {
            timeout
        });
        await this.element.click();
        const download = await downloadPromise;
        await download.saveAs(DOWNLOADS_PATH + download.suggestedFilename());
        return download.suggestedFilename();
    }
}
