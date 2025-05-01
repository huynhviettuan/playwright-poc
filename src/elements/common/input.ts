import { BrowserInstance } from '@common/browser';
import { $, $getByText } from '@common/element.function';
import { ITextBox } from '@models/elements/textbox.interface';
import { Locator, Page } from '@playwright/test';
import { Editable } from '../base/editable';

export class Input extends Editable implements ITextBox {
    constructor(option?: {
        parentLocator?: Locator;
        label?: string;
        index?: number;
        locator?: Locator;
        placeholder?: string;
    }) {
        const baseLocator: Page | Locator = option?.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option
              ? option.label
                  ? (() => {
                        const base: Locator = baseLocator
                            .locator('.input', {
                                has: $getByText(option.label, { exact: true })
                            })
                            .locator(option.placeholder ? `input[placeholder="${option.placeholder}"]` : 'input');
                        return option.index !== undefined ? base.nth(option.index) : base;
                    })()
                  : (() => {
                        const base = baseLocator
                            .locator('.input')
                            .locator(option.placeholder ? `input[placeholder="${option.placeholder}"]` : 'input');
                        return option.index !== undefined ? base.nth(option.index) : base;
                    })()
              : $('.input input');
        super(locator);
    }

    public async getValue(): Promise<string> {
        return await this.getAttribute('value');
    }
}
