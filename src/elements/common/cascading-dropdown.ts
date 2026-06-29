import { BrowserInstance } from '@common/browser';
import { ArrayHelper } from '@helpers/functions/helper-functions';
import { type ISelect } from '@models/elements/multiselect.interface';
import { type Locator } from '@playwright/test';

import { Clickable } from '../base/clickable';

interface CascadingDropdownOptions {
    parentLocator?: Locator;
    locator?: string;
    panelLocator?: string;
    id?: string;
}

export class CascadingDropdown extends Clickable implements ISelect {
    private readonly panelSelector: string;

    constructor(option?: CascadingDropdownOptions) {
        const baseLocator = option?.parentLocator || BrowserInstance.currentPage;
        const locator = option?.id
            ? baseLocator.locator(`#${option.id}`)
            : baseLocator.locator(option?.locator ?? '.cascading-dropdown');
        super(locator);
        this.panelSelector = option?.panelLocator ?? '[role="menu"]';
    }

    async selectPath(path: string[], options?: { exact?: boolean }): Promise<void> {
        await this.click();
        const page = BrowserInstance.currentPage;

        for (let i = 0; i < path.length; i++) {
            const panels = page.locator(`${this.panelSelector}:visible`);
            const currentPanel = panels.nth(i);
            await currentPanel.waitFor({ state: 'visible' });

            const item = options?.exact
                ? currentPanel.getByText(path[i], { exact: true })
                : currentPanel.getByText(path[i]);

            if (i < path.length - 1) {
                await item.hover();
            } else {
                await item.click();
            }
        }
    }

    async selectOption(option: string, exact?: boolean): Promise<void> {
        await this.selectPath([option], { exact });
    }

    async getOptions(): Promise<string[]> {
        await this.click();
        const page = BrowserInstance.currentPage;
        const panel = page.locator(`${this.panelSelector}:visible`).first();
        await panel.waitFor({ state: 'visible' });

        const items = panel.locator('li, [role="menuitem"]');
        return ArrayHelper.forEachSync(await items.all(), async (item) => (await item.innerText()).trim());
    }

    async getSubOptions(parentItem: string): Promise<string[]> {
        await this.click();
        const page = BrowserInstance.currentPage;
        const firstPanel = page.locator(`${this.panelSelector}:visible`).first();
        await firstPanel.waitFor({ state: 'visible' });

        await firstPanel.getByText(parentItem).hover();

        const subPanel = page.locator(`${this.panelSelector}:visible`).nth(1);
        await subPanel.waitFor({ state: 'visible' });

        const items = subPanel.locator('li, [role="menuitem"]');
        return ArrayHelper.forEachSync(await items.all(), async (item) => (await item.innerText()).trim());
    }
}
