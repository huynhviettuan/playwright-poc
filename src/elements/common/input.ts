import { BrowserInstance } from '@common/browser';
import { $getByText } from '@common/element.function';
import { IInput } from '@models/elements/input.interface';
import { Locator, Page } from 'playwright-core';
import { Editable } from '../base/editable';

type InputType = 'input' | 'textarea';

export class Input extends Editable implements IInput {
    constructor(option?: {
        parentLocator?: Locator;
        label?: string;
        index?: number;
        locator?: Locator;
        placeholder?: string;
        id?: string;
        type?: InputType;
    }) {
        if (option?.locator) {
            super(option.locator);
            return;
        }

        const baseLocator = option?.parentLocator || BrowserInstance.currentPage;
        const inputType = option?.type || 'input';

        const locator = Input.buildLocator(baseLocator, inputType, option);
        super(option?.index !== undefined ? locator.nth(option.index) : locator);
    }

    private static buildLocator(
        base: Page | Locator,
        type: InputType,
        opt?: {
            id?: string;
            label?: string;
            placeholder?: string;
        }
    ): Locator {
        if (opt?.id) return base.locator(`#${opt.id}`);

        const selector = Input.buildSelector(type, opt?.placeholder);

        if (opt?.label) {
            return base
                .locator('.input', {
                    has: $getByText(opt.label, { exact: true })
                })
                .locator(selector);
        }

        return base.locator(`.input ${selector}`);
    }

    private static buildSelector(type: InputType, placeholder?: string): string {
        return placeholder ? `${type}[placeholder="${placeholder}"]` : type;
    }

    public async getValue(): Promise<string> {
        return await this.getAttribute('value');
    }
}
