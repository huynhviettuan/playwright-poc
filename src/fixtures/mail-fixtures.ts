import { InvitationMail } from '@mail/invitation.mail';
import { test as base } from '@playwright/test';

type CommandObjects = {
    invitationMail: InvitationMail;
};

export const test = base.extend<CommandObjects>({
    invitationMail: async ({}, use) => {
        await use(new InvitationMail());
    }
});
