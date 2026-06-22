import { $ } from '@common/element.function';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { type Locator } from '@playwright/test';

function stableCacheKey(option: Record<string, unknown>): string {
    const sorted = Object.keys(option)
        .filter((k) => option[k] !== undefined)
        .sort()
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        .map((k) => `${k}:${String(option[k])}`)
        .join('|');
    return sorted;
}

export class Form {
    form: Locator;
    private readonly inputCache = new Map<string, Input>();
    private readonly buttonCache = new Map<string, Button>();

    constructor(parent?: Locator) {
        this.form = parent ? parent.locator('form') : $('form');
    }

    getInput(option: { label?: string; index?: number; locator?: Locator; placeholder?: string; id?: string }): Input {
        const cacheKey = stableCacheKey(option);

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

    getButton(option: { label?: string; index?: number; locator?: Locator; id?: string }): Button {
        const cacheKey = stableCacheKey(option);

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
