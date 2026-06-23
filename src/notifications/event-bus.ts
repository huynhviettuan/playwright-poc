import { type NotificationEvent, type NotificationPayload } from '@models/notifications/notification.interface';

type EventHandler = (payload: NotificationPayload) => Promise<void>;

export class EventBus {
    private static readonly subscribers = new Map<NotificationEvent, EventHandler[]>();

    static subscribe(event: NotificationEvent, handler: EventHandler): void {
        const handlers = EventBus.subscribers.get(event) ?? [];
        handlers.push(handler);
        EventBus.subscribers.set(event, handlers);
    }

    static async publish(event: NotificationEvent, payload: NotificationPayload): Promise<void> {
        const handlers = EventBus.subscribers.get(event) ?? [];
        const results = await Promise.allSettled(handlers.map((handler) => handler(payload)));

        for (const result of results) {
            if (result.status === 'rejected') {
                console.error(`[Notification] Channel failed: ${result.reason}`);
            }
        }
    }

    static clear(): void {
        EventBus.subscribers.clear();
    }
}
