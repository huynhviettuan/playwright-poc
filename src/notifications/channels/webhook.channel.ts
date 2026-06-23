import { type NotificationPayload } from '@models/notifications/notification.interface';
import { BaseChannel } from '@notifications/channels/base.channel';

export class WebhookChannel extends BaseChannel {
    protected async send(payload: NotificationPayload): Promise<void> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (this.config.token) {
            headers['Authorization'] = `Bearer ${this.config.token}`;
        }

        const response = await fetch(this.config.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Webhook notification failed: ${response.status} ${response.statusText}`);
        }
    }
}
