# CI Test Result Notifications

## What

An Observer pattern (producer–consumer) system that sends test result summaries to external channels (Slack, Teams,
email, webhooks) when a Playwright CI run finishes.

## When to Use

-   You want the team to be notified automatically when CI tests fail
-   You need test results posted to a Slack/Teams channel
-   You want to push test summaries to a custom dashboard or monitoring system

## Architecture

The system has three layers:

| Layer         | Role                                             | Class                                |
| ------------- | ------------------------------------------------ | ------------------------------------ |
| **Producer**  | Collects test results during a Playwright run    | `NotificationReporter`               |
| **Observer**  | Decouples producer from consumers via events     | `EventBus`                           |
| **Consumers** | Send formatted notifications to external systems | `SlackChannel`, `TeamsChannel`, etc. |

### Why Observer Pattern?

1. **Open/Closed** — add a new channel without modifying the reporter or existing channels
2. **Single Responsibility** — each channel handles only its own delivery format and error handling
3. **Fault isolation** — `Promise.allSettled` ensures one channel failure doesn't block others
4. **Testability** — channels can be tested independently by publishing events directly to the EventBus

### Flow

```
Playwright test run
    │
    ▼
NotificationReporter.onTestEnd()     ← collects each result
    │
    ▼
NotificationReporter.onEnd()         ← aggregates, deduplicates retries
    │
    ▼
NotificationFormatter.format()       ← builds title, body, color
    │
    ▼
EventBus.publish('suite:finished')   ← fires event
    │
    ├──▶ SlackChannel.handle()       ← checks enabled + onlyOnFailure
    ├──▶ TeamsChannel.handle()
    ├──▶ EmailChannel.handle()
    └──▶ WebhookChannel.handle()
```

## Key Design Decisions

-   **Retries are deduplicated** — only the last attempt of each test counts toward the summary
-   **`onlyOnFailure`** — channels can opt to stay silent on green runs
-   **CI auto-detection** — branch, commit SHA, and run URL are extracted from GitHub Actions and GitLab CI env vars
    automatically
-   **Failed test cap** — only the first 10 failed tests are included to keep messages readable

## Related

-   [configure-notifications skill](../../.claude/skills/configure-notifications.md) — step-by-step setup guide
-   [ADR-005](../decisions/ADR-005-observer-pattern-notifications.md) — why Observer over alternatives
