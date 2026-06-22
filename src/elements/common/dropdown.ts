import { BrowserInstance } from '@common/browser';
import { $, $getByText } from '@common/element.function';
import { ArrayHelper } from '@helpers/helper-functions';
import { type ISelect } from '@models/elements/multiselect.interface';
import { type Locator, type Page } from '@playwright/test';

import { Label } from './label';

export class Dropdown implements ISelect {
    cpnDropdown: Locator;
    lblOption: Label;

    constructor(option?: { label?: string; index?: number; parentLocator?: Locator; id?: string }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
        this.cpnDropdown = option?.id
            ? baseLocator.locator(`#${option.id}`)
            : option
              ? option.label
                  ? baseLocator
                        .locator('.dropdown', {
                            has: $getByText(option.label, {
                                exact: true
                            })
                        })
                        .locator('.select')
                  : baseLocator.locator('.select').nth(option.index ?? 0)
              : $('.select');
        this.lblOption = new Label({
            parentLocator: this.cpnDropdown,
            locator: 'li'
        });
    }

    async selectOption(option: string, exact?: boolean): Promise<void> {
        await this.cpnDropdown.click();
        exact
            ? await this.lblOption.getByText(option, { exact }).click()
            : await this.lblOption.filter({ hasText: option }).click();
    }

    async getSelectedOption(): Promise<string> {
        return this.cpnDropdown.locator('input').inputValue();
    }

    async getOptions(): Promise<string[]> {
        await this.cpnDropdown.click();
        return await ArrayHelper.forEachSync(
            await this.lblOption.element.all(),
            async (element) => (await element.innerText()).trim()
        );
    }

    async selectOptions(options: string[], exact?: boolean): Promise<void> {
        await ArrayHelper.forEachSync(options, async (option): Promise<void> => {
            await this.selectOption(option, exact);
        });
    }
}
