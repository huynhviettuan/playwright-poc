import { type NotificationConfig, type NotificationPayload } from '@models/notifications/notification.interface';
import { ChannelFactory } from '@notifications/channel-factory';
import { EventBus } from '@notifications/event-bus';

export class NotificationManager {
    static initialize(config: NotificationConfig): void {
        if (!config.enabled) return;

        EventBus.clear();

        for (const channelConfig of config.channels) {
            if (!channelConfig.enabled) continue;

            const channel = ChannelFactory.create(channelConfig);

            EventBus.subscribe('suite:finished', async (payload: NotificationPayload) => {
                await channel.handle(payload);
            });
        }
    }

    static async notify(payload: NotificationPayload): Promise<void> {
        await EventBus.publish('suite:finished', payload);
    }
}
