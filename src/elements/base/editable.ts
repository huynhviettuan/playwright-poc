import { BrowserInstance } from '@common/browser';
import { DOWNLOADS_PATH } from '@constants/common.constant';
import { IEditable } from '@models/elements/editable.interface';
import { Locator } from '@playwright/test';
import { BaseControl } from './base-control';

export class Editable extends BaseControl implements IEditable {
    constructor(locator?: Locator) {
        super(locator);
    }

    async fill(
        text: string | number,
        options?: {
            force?: boolean;
            noWaitAfter?: boolean;
            timeout?: number;
        }
    ): Promise<void> {
        if (text) await this.element.fill(text.toString(), options);
    }

    async clear(): Promise<void> {
        await this.element.clear();
    }

    public async fillAndPressEnter(text: string): Promise<void> {
        await this.fill(text);
        await BrowserInstance.currentPage.keyboard.press('Enter');
    }

    public async clearAndFill(text: string | number): Promise<void> {
        await this.clear();
        await this.fill(text);
    }

    async uploadFile(fileName: string, path = DOWNLOADS_PATH): Promise<void> {
        await this.element.setInputFiles(`${path}${fileName}`);
    }
}
