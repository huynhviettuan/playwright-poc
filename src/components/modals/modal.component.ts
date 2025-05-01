import { $ } from '@common/element.function';
import { Button } from '@elements/common/button';
import { ElementStateEnum } from '@enums/element.enum';
import { Locator } from 'playwright-core';

export class Modal {
    cpnDialog: Locator;
    cpnModalHeader: Locator;
    cpnModalBody: Locator;
    btnClose: Button;

    constructor() {
        this.cpnDialog = $('.dialog');
        this.cpnModalHeader = this.cpnDialog.locator('header');
        this.cpnModalBody = this.cpnDialog.locator('.modal-body');
        this.btnClose = new Button({
            locator: this.cpnModalHeader.locator('.close')
        });
    }

    async closeModal(): Promise<void> {
        await this.btnClose.click();
        await this.btnClose.waitFor({ state: ElementStateEnum.HIDDEN });
    }
}
