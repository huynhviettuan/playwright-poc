import { BrowserInstance } from '@common/browser';
import { Locator, Page } from '@playwright/test';
import { Clickable } from '../base/clickable';

export class Label extends Clickable {
    constructor(option: { locator?: string | Locator; parentLocator?: Locator; text?: string; exact?: boolean }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
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
