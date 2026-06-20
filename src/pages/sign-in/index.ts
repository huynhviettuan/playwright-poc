import { SignInFooterContainer } from '@components/containers/sign-in/footer.container';
import { SignInHeaderContainer } from '@components/containers/sign-in/header.container';
import { SignInMainContainer } from '@components/containers/sign-in/main.container';
import { Config } from '@constants/config.constant';

/**
 * Notification surface is centralized — read messages via the `notification`
 * fixture in tests, not from this page object. See docs/guidance/notifications.md.
 */
export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;

    constructor() {
        this.header = new SignInHeaderContainer();
        this.main = new SignInMainContainer();
        this.footer = new SignInFooterContainer();
    }

    async signIn(email: string, password: string = Config.auth.password): Promise<void> {
        await this.main.fillCredentials(email, password);
        await this.main.btnLogin.click();
    }

    async getTitle(): Promise<string> {
        return await this.header.lblTitle.getTextContent();
    }

    async goToForgotPassword(): Promise<void> {
        await this.main.lnkForgotPassword.click();
    }
}
