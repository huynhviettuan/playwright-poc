import { $ } from '@common/element.function';
import { Form } from '@components/form.component';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Skeleton } from '@elements/common/skeleton';
import { Locator } from '@playwright/test';

export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;

    readonly skeleton: Skeleton;
    readonly txtEmail: Input;
    readonly txtPassword: Input;
    readonly btnLogin: Button;

    constructor() {
        this.container = $('div.sign-in');
        this.form = new Form(this.container);
        this.skeleton = new Skeleton({ parentLocator: this.container });
        this.txtEmail = this.form.getInput({ label: 'Email address' });
        this.txtPassword = this.form.getInput({ label: 'Password' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });
    }

    async waitForLoad(timeout?: number): Promise<void> {
        await this.skeleton.waitForAllHidden(timeout);
    }

    async fillCredentials(email: string, password: string): Promise<void> {
        await this.txtEmail.fill(email);
        await this.txtPassword.fill(password);
    }
}
