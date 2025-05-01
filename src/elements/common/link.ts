import { BrowserInstance } from '@common/browser';
import { ILink } from '@models/elements/link.interface';
import { Locator, Page } from '@playwright/test';
import { Clickable } from '../base/clickable';

export class Link extends Clickable implements ILink {
    constructor(option?: { parentLocator?: Locator; label?: string; href?: string; locator?: Locator }) {
        const baseLocator: Page | Locator = option?.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option?.label
              ? baseLocator.locator('a', { hasText: option.label })
              : baseLocator.locator(option.href ? `a[href="${option.href}"]` : 'a');
        super(locator);
    }

    async getReference(): Promise<string | null> {
        return await this.element.getAttribute('href');
    }
}
