import { $ } from '@common/element.function';
import { Label } from '@elements/common/label';
import { Link } from '@elements/common/link';
import { type Locator } from '@playwright/test';

export class SignInFooterContainer {
    private readonly container: Locator;

    readonly lblCopyright: Label;
    readonly lnkTerms: Link;
    readonly lnkPrivacy: Link;

    constructor() {
        this.container = $('footer');
        this.lblCopyright = new Label({ locator: this.container });
        this.lnkTerms = new Link({ parentLocator: this.container, label: 'Terms' });
        this.lnkPrivacy = new Link({ parentLocator: this.container, label: 'Privacy' });
    }
}
