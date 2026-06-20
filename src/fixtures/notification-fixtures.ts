import { Notification } from '@components/notification.component';
import { test as base } from '@playwright/test';

type NotificationFixtures = {
    notification: Notification;
};

export const test = base.extend<NotificationFixtures>({
    notification: async ({}, use) => {
        await use(new Notification());
    }
});
