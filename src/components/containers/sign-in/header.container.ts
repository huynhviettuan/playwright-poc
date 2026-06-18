import { $ } from '@common/element.function';
import { Label } from '@elements/common/label';
import { Locator } from '@playwright/test';

export class SignInHeaderContainer {
    private readonly container: Locator;

    readonly lblTitle: Label;

    constructor() {
        this.container = $('.sign-in-header');
        this.lblTitle = new Label({
            locator: this.container.locator('h2.sign-in__title')
        });
    }
}
