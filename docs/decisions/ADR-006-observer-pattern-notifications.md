# ADR-006: Observer Pattern for CI Notifications

## Status

Accepted

## Date

2026-06-23

## Context

We need to notify the team about test results when CI jobs finish. The system must support multiple channels (Slack,
Teams, email, webhooks) and be easy to extend without modifying existing code.

### Alternatives Considered

1. **Direct calls in reporter** — the reporter calls each channel directly. Simple, but adding a channel means editing
   the reporter. Violates Open/Closed.

2. **Plugin system with dynamic imports** — channels are discovered via file convention. Flexible, but adds complexity
   (file scanning, naming conventions, error handling for missing files) that isn't justified for a small, known set of
   channels.

3. **Observer pattern with EventBus** — the reporter publishes events; channels subscribe independently. Adding a
   channel means creating one class and registering it. The reporter doesn't know which channels exist.

## Decision

Use the **Observer pattern** (option 3) with a static `EventBus` as the mediator.

## Rationale

-   **Open/Closed Principle** — new channels require zero changes to existing code. Create a class extending
    `BaseChannel`, register it in `ChannelFactory`.
-   **Fault isolation** — `Promise.allSettled` in `EventBus.publish()` ensures one failing channel doesn't prevent
    others from sending.
-   **Testability** — each channel can be tested by publishing an event directly, without running a full Playwright
    suite.
-   **Simplicity** — the EventBus is ~25 lines. No dynamic imports, no config file parsing, no reflection.

## Consequences

-   The EventBus uses static state, which means channels are global per process. This is acceptable because the reporter
    runs once at the end of a test suite.
-   Channel ordering is not guaranteed. If ordering matters in the future, the EventBus would need a priority mechanism.
-   Channels must handle their own errors — the EventBus logs failures but does not retry.
