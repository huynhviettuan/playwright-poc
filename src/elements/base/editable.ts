import { BrowserInstance } from '@common/browser';
import { DOWNLOADS_PATH } from '@constants/common.constant';
import { IEditable } from '@models/elements/editable.interface';
import { readFileSync } from 'fs';
import { lookup } from 'mime-types';
import path from 'path';
import { Locator } from 'playwright-core';
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

    public async search(text: string): Promise<void> {
        await this.fill(text);
        await BrowserInstance.currentPage.keyboard.press('Enter');
    }

    async uploadFile(
        fileName: string,
        options?: {
            folderPath?: string;
            useBuffer?: boolean;
        }
    ): Promise<void> {
        const folderPath = options?.folderPath || DOWNLOADS_PATH;
        const filePath = path.join(folderPath, fileName);

        if (options?.useBuffer) {
            await this.element.setInputFiles({
                name: fileName,
                mimeType: lookup(filePath) || 'application/octet-stream',
                buffer: readFileSync(filePath)
            });
        } else {
            await this.element.setInputFiles(filePath);
        }
    }
}
