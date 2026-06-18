import { BrowserInstance } from '@common/browser';
import { $ } from '@common/element.function';
import { ICheckBox } from '@models/elements/checkbox.interface';
import { Locator, Page } from 'playwright-core';
import { Clickable } from '../base/clickable';

export class CheckBox extends Clickable implements ICheckBox {
    constructor(option?: { parentLocator?: Locator; label?: string; index?: number; locator?: Locator }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option
              ? option.label
                  ? baseLocator.getByLabel(option.label).locator('..').locator('.checkbox')
                  : baseLocator.locator('.checkbox').nth(option.index ?? 0)
              : $('.checkbox');
        super(locator);
    }

    async check(): Promise<void> {
        await this.element.click();
    }

    async uncheck(): Promise<void> {
        if ((await this.element.locator('input').getAttribute('class')).includes('is-checked')) {
            await this.check();
        }
    }
}
