import { type NotificationChannelConfig, type NotificationPayload } from '@models/notifications/notification.interface';

export abstract class BaseChannel {
    constructor(protected readonly config: NotificationChannelConfig) {}

    async handle(payload: NotificationPayload): Promise<void> {
        if (!this.config.enabled) return;
        if (this.config.onlyOnFailure && payload.summary.failed === 0) return;
        await this.send(payload);
    }

    protected abstract send(payload: NotificationPayload): Promise<void>;
}
