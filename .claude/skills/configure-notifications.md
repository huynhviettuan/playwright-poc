# Skill: Configure Test Result Notifications

## When to Use

Use this skill when setting up CI notifications for test results — Slack, Teams, email, or custom webhooks.

## Architecture: Observer Pattern (Producer–Consumer)

```
┌──────────────────────┐       publish        ┌──────────────┐       handle       ┌──────────────────┐
│ NotificationReporter │ ──────────────────▶  │   EventBus   │ ──────────────▶   │    Channels      │
│     (Producer)       │   suite:finished     │  (Observer)  │                   │   (Consumers)    │
│                      │                      │              │                   │  Slack / Teams / │
│ Playwright Reporter  │                      │ subscribe()  │                   │  Email / Webhook │
│ collects results     │                      │ publish()    │                   │                  │
└──────────────────────┘                      └──────────────┘                   └──────────────────┘
```

-   **Producer** — `NotificationReporter` implements Playwright's `Reporter` interface. It collects test results during
    the run and publishes a `suite:finished` event with a formatted summary.
-   **EventBus** — Central observer that decouples producers from consumers. Channels subscribe to events; the reporter
    publishes without knowing which channels exist.
-   **Consumers** — Channel classes (`SlackChannel`, `TeamsChannel`, etc.) extend `BaseChannel` and implement `send()`.
    Each decides independently whether to fire (enabled, onlyOnFailure).

## Critical Rules

### ✅ Channels Are Independent

Each channel handles its own errors via `Promise.allSettled`. A Slack failure doesn't prevent Teams from sending.

### ✅ Config Comes from Environment

Channel URLs and tokens come from env vars, not hardcoded values. Use `.env` locally and CI secrets in pipelines.

### ✅ New Channel = One Class

To add a new channel, extend `BaseChannel`, implement `send()`, and register the type in `channel-factory.ts`.

## Instructions

### 1. Add environment variables

```env
# .env (local) or CI secrets
NOTIFY_SLACK_WEBHOOK=https://hooks.slack.com/services/T.../B.../xxx
NOTIFY_TEAMS_WEBHOOK=https://outlook.office.com/webhook/...
NOTIFY_WEBHOOK_URL=https://your-api.com/test-results
NOTIFY_WEBHOOK_TOKEN=your-bearer-token
NOTIFY_EMAIL_URL=https://your-email-api.com/send
NOTIFY_EMAIL_RECIPIENTS=team@example.com,lead@example.com
```

### 2. Register reporter in `playwright.config.ts`

```ts
import { createNotificationReporter, NotificationReporter } from '@notifications/notification-reporter';

const notificationConfig = createNotificationReporter([
    {
        type: 'slack',
        enabled: !!process.env.NOTIFY_SLACK_WEBHOOK,
        url: process.env.NOTIFY_SLACK_WEBHOOK,
        onlyOnFailure: false
    },
    {
        type: 'teams',
        enabled: !!process.env.NOTIFY_TEAMS_WEBHOOK,
        url: process.env.NOTIFY_TEAMS_WEBHOOK,
        onlyOnFailure: true
    },
    {
        type: 'webhook',
        enabled: !!process.env.NOTIFY_WEBHOOK_URL,
        url: process.env.NOTIFY_WEBHOOK_URL,
        token: process.env.NOTIFY_WEBHOOK_TOKEN
    }
]);

export default defineConfig({
    reporter: process.env.CI
        ? [['@reportportal/agent-js-playwright', RPconfig], [new NotificationReporter(notificationConfig)]]
        : undefined
});
```

### 3. Add CI secrets

**GitHub Actions** — add to repository Settings → Secrets:

```yaml
env:
    NOTIFY_SLACK_WEBHOOK: ${{ secrets.NOTIFY_SLACK_WEBHOOK }}
    NOTIFY_TEAMS_WEBHOOK: ${{ secrets.NOTIFY_TEAMS_WEBHOOK }}
```

**GitLab CI** — add to Settings → CI/CD → Variables.

### 4. Add a custom channel

```ts
// src/notifications/channels/discord.channel.ts
import { type NotificationPayload } from '@models/notifications/notification.interface';
import { BaseChannel } from '@notifications/channels/base.channel';

export class DiscordChannel extends BaseChannel {
    protected async send(payload: NotificationPayload): Promise<void> {
        const { title, body } = payload.formatted;
        await fetch(this.config.url!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `**${title}**\n${body}`
            })
        });
    }
}
```

Then register in `channel-factory.ts`:

```ts
import { DiscordChannel } from '@notifications/channels/discord.channel';
// Add to channelMap:
discord: DiscordChannel;
```

## File Structure

```
src/notifications/
├── event-bus.ts              ← Observer — subscribe/publish
├── formatter.ts              ← Formats TestRunSummary → NotificationPayload
├── notification-manager.ts   ← Initializes channels, wires to EventBus
├── notification-reporter.ts  ← Playwright Reporter (producer)
├── channel-factory.ts        ← Creates channel instances by type
└── channels/
    ├── base.channel.ts       ← Abstract base (enabled/onlyOnFailure guard)
    ├── slack.channel.ts      ← Slack Incoming Webhook
    ├── teams.channel.ts      ← Microsoft Teams Connector
    ├── email.channel.ts      ← Email API endpoint
    └── webhook.channel.ts    ← Generic webhook (any HTTP endpoint)

src/models/notifications/
└── notification.interface.ts ← All types (TestRunSummary, NotificationPayload, configs)
```

## Notification Payload Example

```json
{
    "summary": {
        "totalTests": 42,
        "passed": 40,
        "failed": 2,
        "skipped": 0,
        "timedOut": 0,
        "duration": 180000,
        "startedAt": "2026-06-23T10:00:00Z",
        "finishedAt": "2026-06-23T10:03:00Z",
        "project": "e2e",
        "branch": "main",
        "commitSha": "abc1234",
        "runUrl": "https://github.com/org/repo/actions/runs/123",
        "failedTests": [
            {
                "title": "should create user",
                "suite": "Users API",
                "status": "failed",
                "duration": 5000,
                "error": "Expected 201 but received 500",
                "retry": 1
            }
        ]
    },
    "formatted": {
        "title": "❌ Test Run Failed — e2e",
        "body": "**Total:** 42 | **Passed:** 40 | **Failed:** 2 ...",
        "color": "#e74c3c"
    }
}
```
