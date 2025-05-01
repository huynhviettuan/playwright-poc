import { BrowserInstance } from '@common/browser';
import { $, $getByText } from '@common/element.function';
import { IClickable } from '@models/elements/clickable.interface';
import { Locator, Page } from '@playwright/test';
import { Clickable } from '../base/clickable';

export class Button extends Clickable implements IClickable {
    constructor(option?: { parentLocator?: Locator; label?: string; index?: number; locator?: Locator }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option
              ? option.label
                  ? baseLocator.locator('button', {
                        has: $getByText(option.label, {
                            exact: true
                        })
                    })
                  : baseLocator.locator('button').nth(option.index ?? 0)
              : $('button');
        super(locator);
    }
}
