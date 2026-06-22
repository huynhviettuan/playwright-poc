import { BrowserInstance } from '@common/browser';
import { $, $getByText } from '@common/element.function';
import { Clickable } from '@elements/base/clickable';
import { type IGroupRadioButton } from '@models/elements/group-radio-button.interface';
import { type Locator, type Page } from '@playwright/test';

export class GroupRadioButton extends Clickable implements IGroupRadioButton {
    constructor(option?: {
        parentLocator?: Locator;
        label?: string;
        index?: number;
        locator?: Locator;
        id?: string;
    }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option?.id
              ? baseLocator.locator(`#${option.id}`)
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
