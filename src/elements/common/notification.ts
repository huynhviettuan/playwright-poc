import { $ } from '@common/element.function';
import { ElementStateEnum } from '@enums/element.enum';
import { Locator } from 'playwright-core';
import { Button } from './button';

export class Notification {
    cpnCustomToast: Locator;
    btnClose: Button;

    constructor() {
        this.cpnCustomToast = $('.notification');
        this.btnClose = new Button({
            locator: this.cpnCustomToast.locator('button')
        });
    }

    async getMessage(): Promise<string> {
        const message: string = await this.cpnCustomToast.filter({}).textContent();
        if (await this.btnClose.isVisible()) {
            await this.btnClose.click();
            await this.btnClose.waitFor({ state: ElementStateEnum.HIDDEN });
        }
        return message;
    }
}
