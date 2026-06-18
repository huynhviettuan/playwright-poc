import { $ } from '@common/element.function';
import { Label } from '@elements/common/label';
import { Locator } from '@playwright/test';

export class Toast {
    private readonly container: Locator;
    private readonly message: Label;

    constructor(selector: string = '.toast, .notification, .alert') {
        this.container = $(selector);
        this.message = new Label({ locator: this.container });
    }

    async getMessage(): Promise<string> {
        return await this.message.getTextContent();
    }

    async waitForVisible(timeout: number = 5000): Promise<void> {
        await this.container.waitFor({ state: 'visible', timeout });
    }

    async waitForHidden(timeout: number = 5000): Promise<void> {
        await this.container.waitFor({ state: 'hidden', timeout });
    }

    async isVisible(): Promise<boolean> {
        return await this.container.isVisible();
    }

    async close(): Promise<void> {
        const closeButton = this.container.locator('[aria-label="Close"], .close');
        if (await closeButton.isVisible()) {
            await closeButton.click();
        }
    }
}
