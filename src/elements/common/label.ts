import { BrowserInstance } from '@common/browser';
import { Clickable } from '@elements/base/clickable';
import { type Locator, type Page } from '@playwright/test';

export class Label extends Clickable {
    constructor(option: {
        locator?: string | Locator;
        parentLocator?: Locator;
        text?: string;
        exact?: boolean;
        id?: string;
    }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;

        if (option.id) {
            super(baseLocator.locator(`#${option.id}`));
            return;
        }

        let resolvedLocator: Locator;
        if (option.locator && option.text) {
            if (typeof option.locator === 'string') {
                resolvedLocator = baseLocator.locator(option.locator, {
                    hasText: option.text
                });
            } else {
                resolvedLocator = option.locator;
            }
        } else if (option.locator) {
            resolvedLocator = typeof option.locator === 'string' ? baseLocator.locator(option.locator) : option.locator;
        } else if (option.text) {
            resolvedLocator = baseLocator.getByText(option.text, { exact: option.exact });
        }
        super(resolvedLocator);
    }
}
