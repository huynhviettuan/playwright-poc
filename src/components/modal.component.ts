import { $ } from '@common/element.function';
import { Button } from '@elements/common/button';
import { Locator } from '@playwright/test';

export class Modal {
    private readonly modal: Locator;

    constructor(selector: string | Locator) {
        this.modal = typeof selector === 'string' ? $(selector) : selector;
    }

    getButton(option: { label?: string; index?: number }): Button {
        return new Button({
            parentLocator: this.modal,
            ...option
        });
    }

    async waitForVisible(): Promise<void> {
        await this.modal.waitFor({ state: 'visible' });
    }

    async waitForHidden(): Promise<void> {
        await this.modal.waitFor({ state: 'hidden' });
    }

    async close(): Promise<void> {
        const closeButton = this.modal.locator('[aria-label="Close"], .close, button.close');
        await closeButton.click();
    }

    async isVisible(): Promise<boolean> {
        return await this.modal.isVisible();
    }
}
