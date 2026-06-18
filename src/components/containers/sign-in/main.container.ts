import { $ } from '@common/element.function';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Form } from '@components/form.component';
import { Locator } from '@playwright/test';

export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;
    
    readonly txtEmail: Input;
    readonly txtPassword: Input;
    readonly btnLogin: Button;
    
    constructor() {
        this.container = $('div.sign-in');
        this.form = new Form(this.container);
        
        this.txtEmail = this.form.getInput({ label: 'Email address' });
        this.txtPassword = this.form.getInput({ label: 'Password' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });
    }
    
    async fillCredentials(email: string, password: string): Promise<void> {
        await this.txtEmail.fill(email);
        await this.txtPassword.fill(password);
    }
}
