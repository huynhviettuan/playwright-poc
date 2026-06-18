import { BrowserInstance } from '@common/browser';
import { $, $getByText } from '@common/element.function';
import { IGroupRadioButton } from '@models/elements/group-radio-button.interface';
import { Locator, Page } from 'playwright-core';
import { Clickable } from '../base/clickable';

export class GroupRadioButton extends Clickable implements IGroupRadioButton {
    constructor(option?: { parentLocator?: Locator; label?: string; index?: number; locator?: Locator }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option
              ? option.label
                  ? baseLocator.getByLabel(option.label).locator('..').locator('.group-radio-button')
                  : baseLocator.locator('.group-radio-button').nth(option.index ?? 0)
              : $('.group-radio-button');
        super(locator);
    }

    async selectOption(option: string): Promise<void> {
        await this.element.getByText(option).click();
    }

    async setState(isYes: boolean): Promise<void> {
        await this.element.getByText(isYes ? 'Yes' : 'No').click();
    }

    async isOptionChecked(option: string): Promise<boolean> {
        return (
            await this.element
                .locator('.radio-button', { has: $getByText(option, { exact: true }) })
                .getAttribute('class')
        ).includes('is-checked');
    }
}
