import { BrowserInstance } from '@common/browser';
import { IImage } from '@models/elements/image.interface';
import { Locator, Page } from 'playwright-core';
import { Clickable } from '../base/clickable';
export class Image extends Clickable implements IImage {
    constructor(option?: { parentLocator?: Locator; alt?: string; index?: number; locator?: Locator }) {
        const baseLocator: Page | Locator = option?.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option?.alt
              ? baseLocator.locator(`img[alt="${option.alt}"]`)
              : baseLocator.locator('img').nth(option.index ?? 0);
        super(locator);
    }

    async getSource(): Promise<string | null> {
        return await this.element.getAttribute('src');
    }

    async getAlt(): Promise<string | null> {
        return await this.element.getAttribute('alt');
    }

    async getBoundingBox(): Promise<{ x: number; y: number; width: number; height: number }> {
        return await this.element.boundingBox();
    }
}
