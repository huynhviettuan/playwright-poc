import { BrowserInstance } from '@common/browser';
import { $, $getByText } from '@common/element.function';
import { Clickable } from '@elements/base/clickable';
import { type IClickable } from '@models/elements/clickable.interface';
import { type Locator, type Page } from '@playwright/test';

export class Button extends Clickable implements IClickable {
    constructor(option?: { parentLocator?: Locator; label?: string; index?: number; locator?: Locator; id?: string }) {
        const baseLocator: Page | Locator = option.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator
            ? option.locator
            : option?.id
              ? baseLocator.locator(`#${option.id}`)
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
