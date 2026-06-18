import { $ } from '@common/element.function';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Locator } from 'playwright-core';

export class Form {
    form: Locator;
    private inputCache = new Map<string, Input>();
    private buttonCache = new Map<string, Button>();

    constructor(parent?: Locator) {
        this.form = parent ? parent.locator('form') : $('form');
    }

    getInput(option: { label?: string; index?: number; locator?: Locator; placeholder?: string; id?: string }): Input {
        const cacheKey = JSON.stringify(option);

        if (!this.inputCache.has(cacheKey)) {
            this.inputCache.set(
                cacheKey,
                new Input({
                    parentLocator: this.form,
                    ...option
                })
            );
        }

        return this.inputCache.get(cacheKey);
    }

    getButton(option: { label?: string; index?: number; locator?: Locator }): Button {
        const cacheKey = JSON.stringify(option);

        if (!this.buttonCache.has(cacheKey)) {
            this.buttonCache.set(
                cacheKey,
                new Button({
                    parentLocator: this.form,
                    ...option
                })
            );
        }

        return this.buttonCache.get(cacheKey);
    }

    async submit(): Promise<void> {
        await this.form.locator('[type="submit"]').click();
    }
}
