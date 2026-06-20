import { $ } from '@common/element.function';
import { Form } from '@components/form.component';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Link } from '@elements/common/link';
import { Locator } from '@playwright/test';

export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;

    readonly txtEmail: Input;
    readonly txtPassword: Input;
    readonly btnLogin: Button;
    readonly lnkForgotPassword: Link;

    constructor() {
        this.container = $('main');
        this.form = new Form(this.container);

        this.txtEmail = this.form.getInput({ label: 'Email' });
        this.txtPassword = this.form.getInput({ label: 'Password' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });

        this.lnkForgotPassword = new Link({
            parentLocator: this.container,
            label: 'Forgot password?'
        });
    }

    async fillCredentials(email: string, password: string): Promise<void> {
        await this.txtEmail.fill(email);
        await this.txtPassword.fill(password);
    }
}
