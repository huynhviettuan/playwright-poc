import { $ } from '@common/element.function';
import { ISkeleton } from '@models/elements/skeleton.interface';
import { expect, Locator } from '@playwright/test';
import { BaseControl } from '../base/base-control';

const DEFAULT_SKELETON_SELECTOR = [
    '.skeleton',
    '.ant-skeleton',
    '.MuiSkeleton-root',
    '[data-testid*="skeleton"]',
    '[class*="skeleton"]'
].join(', ');

export class Skeleton extends BaseControl implements ISkeleton {
    constructor(option?: { parentLocator?: Locator; locator?: Locator; selector?: string }) {
        const selector = option?.selector || DEFAULT_SKELETON_SELECTOR;
        const locator = option?.locator || option?.parentLocator?.locator(selector) || $(selector);
        super(locator);
    }

    async waitForHidden(timeout: number = 30000): Promise<void> {
        await this.element.first().waitFor({ state: 'hidden', timeout });
    }

    async waitForAllHidden(timeout: number = 30000): Promise<void> {
        await expect(this.element).toHaveCount(0, { timeout });
    }

    async hasVisibleSkeleton(): Promise<boolean> {
        return await this.element.first().isVisible();
    }
}
