import { BrowserInstance } from '@common/browser';
import { Clickable } from '@elements/base/clickable';
import { type ILink } from '@models/elements/link.interface';
import { type Locator, type Page } from '@playwright/test';

export class Link extends Clickable implements ILink {
    constructor(option?: {
        parentLocator?: Locator;
        label?: string;
        href?: string;
        locator?: Locator;
        id?: string;
    }) {
        const baseLocator: Page | Locator = option?.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option?.id
              ? baseLocator.locator(`#${option.id}`)
              : option?.label
                ? baseLocator.locator('a', { hasText: option.label })
                : baseLocator.locator(option?.href ? `a[href="${option.href}"]` : 'a');
        super(locator);
    }

    async getReference(): Promise<string | null> {
        return await this.element.getAttribute('href');
    }
}
