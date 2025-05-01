import { BrowserInstance } from '@common/browser';
import { MAIL_DOMAIN } from '@constants/config.constant';
import { decodeHTML, generateQueryParamsPath } from '@helpers/helper-functions';
import { IMail, MailResponse } from '@models/mail/mail.interface';
import { APIResponse, Page } from '@playwright/test';
import * as cheerio from 'cheerio';

export class BaseMail implements IMail {
    mailDomain: string;
    subject: string;
    constructor() {
        this.mailDomain = MAIL_DOMAIN;
    }

    get page(): Page {
        return BrowserInstance.currentPage;
    }

    async getMails(mail: { to: string; subject?: string }): Promise<MailResponse[]> {
        const response: APIResponse = await (
            await BrowserInstance.getRequest()
        ).get(`${this.mailDomain}?headers${generateQueryParamsPath(mail, '.')}`);
        return (await response.text()) ? await response.json() : null;
    }

    async waitForMail(to: string, subject: string): Promise<void> {
        const retryUntil: (
            condition: () => Promise<boolean>,
            maxRetries: number,
            interval: number
        ) => Promise<void> = async (condition, maxRetries, interval) => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                if (await condition()) return;
                await new Promise((resolve) => setTimeout(resolve, interval));
            }
            throw new Error(`No Email With Subject ${subject} to ${to}`);
        };
        await retryUntil(
            async () => {
                const mails = await this.getMails({ to, subject });
                return mails.length > 0;
            },
            30,
            1000
        );
    }

    async getMailBox(to: string): Promise<MailResponse[]> {
        const mails: MailResponse[] = await this.getMails({ to, subject: this.subject });
        return mails;
    }

    async getLatestMail(to: string, subject: string): Promise<MailResponse> {
        const mails: MailResponse[] = await this.getMails({ to, subject });
        return mails[mails.length - 1];
    }

    async getHeaderMailInformation(
        to: string,
        subject: string
    ): Promise<{
        subject: string;
        from: string;
        to: string;
    }> {
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

    async deleteMailByUser(to: string): Promise<void> {
        const mails = await this.getMails({ to, subject: this.subject });
        if (mails) {
            for (const { id } of mails) {
                await (await BrowserInstance.getRequest()).delete(`${this.mailDomain}/${id}`);
            }
        }
    }

    async extractToken(email: string): Promise<string> {
        const html: string = await this.getHtml(email, this.subject);
        return /token=([\w-]+)/g.exec(decodeHTML(html))[1];
    }

    async getContent(email: string): Promise<string> {
        const html: string = await this.getHtml(email, this.subject);
        const $ = cheerio.load(html);
        return $('body')
            .text()
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/Kind.*|Best.*|Privacy.*|親切的問候.*|私隱政策.*|隱私政策.*/, '')
            .trim();
    }

    async deleteAllMails(): Promise<void> {
        await (await BrowserInstance.getRequest()).delete(`${this.mailDomain}/all`);
    }

    async getMailContent(to: string): Promise<MailResponse> {
        const mails: MailResponse[] = await this.getMails({ to, subject: this.subject });
        return mails[mails.length - 1];
    }
}
