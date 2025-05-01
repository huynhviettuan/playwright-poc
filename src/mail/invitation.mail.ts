import { decodeHTML } from 'src/helpers/helper-functions';
import { BaseMail } from './mail';

export class InvitationMail extends BaseMail {
    constructor() {
        super();
        this.subject = 'Invitation';
    }

    async goToSignupPage(email: string): Promise<void> {
        const html: string = await this.getHtml(email, this.subject);
        const link: string = /https:\/\/.*\/sign-up\?invite-token=[a-f0-9\\-]+/g.exec(decodeHTML(html))[0];
        await this.page.goto(link);
        await this.page.waitForLoadState();
    }
}
