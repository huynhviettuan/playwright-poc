import { type NotificationPayload } from '@models/notifications/notification.interface';
import { BaseChannel } from '@notifications/channels/base.channel';

export class SlackChannel extends BaseChannel {
    protected async send(payload: NotificationPayload): Promise<void> {
        const { title, body, color } = payload.formatted;

        const slackPayload = {
            attachments: [
                {
                    color,
                    blocks: [
                        {
                            type: 'header',
                            text: { type: 'plain_text', text: title }
                        },
                        {
                            type: 'section',
                            text: { type: 'mrkdwn', text: SlackChannel.toSlackMarkdown(body) }
                        }
                    ]
                }
            ]
        };

        const response = await fetch(this.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload)
        });

        if (!response.ok) {
            throw new Error(`Slack notification failed: ${response.status} ${response.statusText}`);
        }
    }

    private static toSlackMarkdown(md: string): string {
        return md.replace(/\*\*(.*?)\*\*/g, '*$1*').replace(/\[(.+?)\]\((.+?)\)/g, '<$2|$1>');
    }
}
