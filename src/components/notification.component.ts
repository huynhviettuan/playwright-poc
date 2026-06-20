import { $ } from '@common/element.function';
import { Label } from '@elements/common/label';
import { Locator } from '@playwright/test';

const DEFAULT_CONTAINER_SELECTOR = '.toast, .notification, .alert, [role="alert"], [role="status"]';
const DEFAULT_MESSAGE_CHILD_SELECTOR = '.toast__message, .notification__message, .message, [data-testid*="message"]';

export class Notification {
    private readonly container: Locator;
    private readonly message: Label;

    constructor(options: { containerSelector?: string; messageChildSelector?: string } = {}) {
        const containerSelector = options.containerSelector ?? DEFAULT_CONTAINER_SELECTOR;
        const childSelector = options.messageChildSelector ?? DEFAULT_MESSAGE_CHILD_SELECTOR;

        this.container = $(containerSelector);
        const child = this.container.locator(childSelector).first();
        this.message = new Label({ locator: child.or(this.container.first()) });
    }

    async getMessage(): Promise<string> {
        await this.waitForVisible();
        return await this.message.getTextContent();
    }

    async waitForMessage(expected: string, timeout: number = 5000): Promise<void> {
        await this.container.filter({ hasText: expected }).first().waitFor({ state: 'visible', timeout });
    }

    async waitForVisible(timeout: number = 5000): Promise<void> {
        await this.container.first().waitFor({ state: 'visible', timeout });
    }

    async waitForHidden(timeout: number = 5000): Promise<void> {
        await this.container.first().waitFor({ state: 'hidden', timeout });
    }

    async isVisible(): Promise<boolean> {
        return await this.container.first().isVisible();
    }

    async close(): Promise<void> {
        const closeButton = this.container.locator('[aria-label="Close"], .close, .toast__close');
        if (await closeButton.first().isVisible()) {
            await closeButton.first().click();
        }
    }
}
