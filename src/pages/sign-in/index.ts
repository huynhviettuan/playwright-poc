import { $ } from '@common/element.function';
import { PASSWORD } from '@constants/config.constant';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Label } from '@elements/common/label';
import { Notification } from '@elements/common/notification';
import { Locator } from 'playwright-core';

export class SignInPage {
    cpnSignInForm: Locator;
    lblSignInTitle: Label;
    txtEmailAddress: Input;
    txtPassword: Input;
    btnLogin: Button;
    notification: Notification;

    constructor() {
        this.cpnSignInForm = $('div.sign-in form');
        this.lblSignInTitle = new Label({ locator: '.sign-in' });
        this.txtEmailAddress = new Input({
            parentLocator: this.cpnSignInForm,
            label: 'Email address'
        });
        this.txtPassword = new Input({
            parentLocator: this.cpnSignInForm,
            label: 'Password'
        });
        this.btnLogin = new Button({
            parentLocator: this.cpnSignInForm,
            label: 'Log in'
        });
        this.notification = new Notification();
    }

    async signIn(email: string, password = PASSWORD): Promise<void> {
        await this.txtEmailAddress.fill(email);
        await this.txtPassword.fill(password);
        await this.btnLogin.click();
    }
}
