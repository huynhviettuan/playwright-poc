import { BrowserInstance } from '@common/browser';
import { Config } from '@constants/config.constant';
import { StringHelper } from '@helpers/helper-functions';
import { type IMail, type MailResponse } from '@models/mail/mail.interface';
import { type APIResponse } from '@playwright/test';
import * as cheerio from 'cheerio';

class MailApiClient {
    constructor(private readonly mailDomain: string) {}

    async getMails(params: { to: string; subject?: string }): Promise<MailResponse[]> {
        const response: APIResponse = await (await BrowserInstance.getRequest()).get(this.mailDomain, { params });
        return (await response.text()) ? ((await response.json()) as MailResponse[]) : null;
    }

    async deleteMail(id: string): Promise<void> {
        await (await BrowserInstance.getRequest()).delete(`${this.mailDomain}/${id}`);
    }

    async deleteAllMails(): Promise<void> {
        await (await BrowserInstance.getRequest()).delete(`${this.mailDomain}/all`);
    }
}

class MailContentParser {
    static extractToken(html: string): string {
        const decoded = StringHelper.decodeHtml(html);
        const match = /token=([\w-]+)/g.exec(decoded);
        return match ? match[1] : null;
    }

    static getTextContent(html: string): string {
        const $ = cheerio.load(html);
        return $('body')
            .text()
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/Kind.*|Best.*|Privacy.*|親切的問候.*|私隱政策.*|隱私政策.*/, '')
            .trim();
    }
}

class MailWaiter {
    static async waitForCondition(
        condition: () => Promise<boolean>,
        options: { maxRetries?: number; interval?: number; errorMessage?: string } = {}
    ): Promise<void> {
        const { maxRetries = 30, interval = 1000, errorMessage = 'Condition not met' } = options;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (await condition()) return;
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error(errorMessage);
    }
}

export class Mail implements IMail {
    private readonly apiClient: MailApiClient;
    mailDomain: string;

    constructor() {
        this.mailDomain = Config.app.mailDomain;
        this.apiClient = new MailApiClient(this.mailDomain);
    }

    async getMails(mail: { to: string; subject?: string }): Promise<MailResponse[]> {
        return await this.apiClient.getMails(mail);
    }

    async waitForMail(to: string, subject: string): Promise<void> {
        await MailWaiter.waitForCondition(
            async () => {
                const mails = await this.getMails({ to, subject });
                return mails && mails.length > 0;
            },
            {
                maxRetries: 30,
                interval: 1000,
                errorMessage: `No Email with subject "${subject}" to ${to}`
            }
        );
    }

    async getMailBox(to: string, subject?: string): Promise<MailResponse[]> {
        return await this.getMails({ to, subject });
    }

    async getLatestMail(to: string, subject: string): Promise<MailResponse> {
        const mails = await this.getMails({ to, subject });
        return mails[mails.length - 1];
    }

    async getHeaderMailInformation(
        to: string,
        subject: string
    ): Promise<{ subject: string; from: string; to: string }> {
        const { headers } = await this.getLatestMail(to, subject);
        return {
            subject: headers.subject,
            from: headers.from,
            to: headers.to
        };
    }

    async getHtml(to: string, subject: string): Promise<string> {
        await this.waitForMail(to, subject);
        const { html } = await this.getLatestMail(to, subject);
        return String(html);
    }

    async deleteMailByUser(to: string, subject?: string): Promise<void> {
        const mails = await this.getMails({ to, subject });
        if (mails) {
            for (const { id } of mails) {
                await this.apiClient.deleteMail(id);
            }
        }
    }

    async extractToken(email: string, subject: string): Promise<string> {
        const html = await this.getHtml(email, subject);
        return MailContentParser.extractToken(html);
    }

    async getContent(email: string, subject: string): Promise<string> {
        const html = await this.getHtml(email, subject);
        return MailContentParser.getTextContent(html);
    }

    async deleteAllMails(): Promise<void> {
        await this.apiClient.deleteAllMails();
    }

    async getMailContent(to: string, subject: string): Promise<MailResponse> {
        const mails = await this.getMails({ to, subject });
        return mails[mails.length - 1];
    }
}
