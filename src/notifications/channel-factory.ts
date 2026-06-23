import type { NotificationChannelConfig } from '@models/notifications/notification.interface';
import type { BaseChannel } from '@notifications/channels/base.channel';
import { EmailChannel } from '@notifications/channels/email.channel';
import { SlackChannel } from '@notifications/channels/slack.channel';
import { TeamsChannel } from '@notifications/channels/teams.channel';
import { WebhookChannel } from '@notifications/channels/webhook.channel';

const channelMap: Record<string, new (config: NotificationChannelConfig) => BaseChannel> = {
    slack: SlackChannel,
    teams: TeamsChannel,
    email: EmailChannel,
    webhook: WebhookChannel
};

export class ChannelFactory {
    static create(config: NotificationChannelConfig): BaseChannel {
        const Channel = channelMap[config.type];
        if (!Channel) {
            throw new Error(`Unknown notification channel: ${config.type}`);
        }
        return new Channel(config);
    }
}
