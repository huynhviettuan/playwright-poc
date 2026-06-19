import { BrowserInstance } from '@common/browser';
import { PASSWORD } from '@constants/config.constant';
import { ENDPOINTS } from '@constants/endpoints.constant';
import { SignInPage } from '@pages/sign-in';

export class Commands {
    signInPage: SignInPage;

    constructor() {
        this.signInPage = new SignInPage();
    }

    async loginWithUser(email: string, password = PASSWORD): Promise<void> {
        await BrowserInstance.currentPage.goto(ENDPOINTS.SIGN_IN);
        await this.signInPage.signIn(email, password);
    }
}
