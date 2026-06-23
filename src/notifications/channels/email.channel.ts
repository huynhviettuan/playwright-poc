import { type NotificationPayload } from '@models/notifications/notification.interface';
import { BaseChannel } from '@notifications/channels/base.channel';

export class EmailChannel extends BaseChannel {
    protected async send(payload: NotificationPayload): Promise<void> {
        const { title, body } = payload.formatted;
        const recipients = this.config.recipients ?? [];

        if (recipients.length === 0) {
            throw new Error('Email channel requires at least one recipient');
        }

        const emailPayload = {
            to: recipients,
            subject: title,
            body,
            html: EmailChannel.toHtml(payload)
        };

        const response = await fetch(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {})
            },
            body: JSON.stringify(emailPayload)
        });

        if (!response.ok) {
            throw new Error(`Email notification failed: ${response.status} ${response.statusText}`);
        }
    }

    private static toHtml(payload: NotificationPayload): string {
        const { summary } = payload;
        const rows = summary.failedTests
            .slice(0, 10)
            .map((t) => `<tr><td>${t.suite}</td><td>${t.title}</td><td>${t.error?.substring(0, 100) ?? ''}</td></tr>`)
            .join('');

        const failedTable =
            summary.failedTests.length > 0
                ? `<h3>Failed Tests</h3><table border="1" cellpadding="4"><tr><th>Suite</th><th>Test</th><th>Error</th></tr>${rows}</table>`
                : '';

        return `
            <h2>${payload.formatted.title}</h2>
            <p>Total: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed} | Skipped: ${summary.skipped}</p>
            <p>Duration: ${Math.floor(summary.duration / 1000)}s</p>
            ${failedTable}
        `.trim();
    }
}
