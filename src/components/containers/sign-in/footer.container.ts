import { $ } from '@common/element.function';
import { Label } from '@elements/common/label';
import { Locator } from '@playwright/test';

export class SignInFooterContainer {
    private readonly container: Locator;

    readonly lblCopyright: Label;

    constructor() {
        this.container = $('.sign-in-footer');
        this.lblCopyright = new Label({ locator: this.container.locator('.copyright') });
    }
}
