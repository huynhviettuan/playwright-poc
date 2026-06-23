import { type NotificationPayload } from '@models/notifications/notification.interface';
import { BaseChannel } from '@notifications/channels/base.channel';

export class TeamsChannel extends BaseChannel {
    protected async send(payload: NotificationPayload): Promise<void> {
        const { title, body, color } = payload.formatted;

        const teamsPayload = {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            themeColor: color.replace('#', ''),
            summary: title,
            sections: [
                {
                    activityTitle: title,
                    text: TeamsChannel.toTeamsMarkdown(body)
                }
            ]
        };

        const response = await fetch(this.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsPayload)
        });

        if (!response.ok) {
            throw new Error(`Teams notification failed: ${response.status} ${response.statusText}`);
        }
    }

    private static toTeamsMarkdown(md: string): string {
        return md.replace(/`(.*?)`/g, '`$1`');
    }
}
