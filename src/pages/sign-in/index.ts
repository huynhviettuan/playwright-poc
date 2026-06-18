import { SignInFooterContainer } from '@components/containers/sign-in/footer.container';
import { SignInHeaderContainer } from '@components/containers/sign-in/header.container';
import { SignInMainContainer } from '@components/containers/sign-in/main.container';
import { Toast } from '@components/toast.component';
import { Config } from '@constants/config.constant';

export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;
    readonly toast: Toast;

    constructor() {
        this.header = new SignInHeaderContainer();
        this.main = new SignInMainContainer();
        this.footer = new SignInFooterContainer();
        this.toast = new Toast();
    }

    async signIn(email: string, password: string = Config.auth.password): Promise<void> {
        await this.main.fillCredentials(email, password);
        await this.main.btnLogin.click();
    }

    async getTitle(): Promise<string> {
        return await this.header.lblTitle.getTextContent();
    }
}
