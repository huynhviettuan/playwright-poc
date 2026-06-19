export interface IMail {
    mailDomain: string;
    getMails(mail: { to: string; subject?: string }): Promise<MailResponse[]>;
    waitForMail(to: string, subject: string): Promise<void>;
    getMailBox(to: string, subject?: string): Promise<MailResponse[]>;
    getLatestMail(to: string, subject: string): Promise<MailResponse>;
    getHeaderMailInformation(to: string, subject: string): Promise<{ subject: string; from: string; to: string }>;
    getHtml(to: string, subject: string): Promise<string>;
    deleteMailByUser(to: string, subject?: string): Promise<void>;
    extractToken(email: string, subject: string): Promise<string>;
    getContent(email: string, subject: string): Promise<string>;
    deleteAllMails(): Promise<void>;
    getMailContent(to: string, subject: string): Promise<MailResponse>;
}

export type MailResponse = {
    html: string;
    headers: MailHeaders;
    subject: string;
    messageId: string;
    priority: string;
    from: MailFromElement[];
    to: MailFromElement[];
    date: Date;
    id: string;
    time: Date;
    read: boolean;
    envelope: MailEnvelope;
    source: string;
    size: number;
    sizeHuman: string;
    attachments: string;
};

export type MailEnvelope = {
    from: MailEnvelopeFrom;
    to: MailEnvelopeFrom[];
    host: string;
    remoteAddress: string;
};

export type MailEnvelopeFrom = {
    address: string;
    args: boolean;
};

export type MailFromElement = {
    address: string;
    name: string;
};

export type MailHeaders = {
    from: string;
    to: string;
    subject: string;
    'message-id': string;
    'content-transfer-encoding': string;
    date: string;
    'mime-version': string;
    'content-type': string;
};
