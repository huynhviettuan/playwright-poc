import { BaseMail } from './mail';

export class InvitationMail extends BaseMail {
    constructor() {
        super();
        this.subject = 'Invitation';
    }

    async goToSignupPage(email: string): Promise<void> {
        const token = await this.extractToken(email);
        await this.page.goto(`/sign-up?invite-token=${token}`);
        await this.page.waitForLoadState();
    }
}
