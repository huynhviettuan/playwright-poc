# Design Patterns Reference

Every pattern used in this framework, where it lives, and why it was chosen.

## At a Glance

| Pattern                                           | Where                                                         | Purpose                                                  |
| ------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| [Singleton](#singleton)                           | `BrowserInstance`                                             | One browser/page per worker process                      |
| [Composition](#composition)                       | Pages → Containers → Elements                                 | Build pages from reusable sections                       |
| [Template Method](#template-method)               | `BaseChannel`, `BaseControl`                                  | Define skeleton; subclasses fill in steps                |
| [Strategy](#strategy)                             | Notification channels                                         | Interchangeable send algorithms per platform             |
| [Observer](#observer)                             | `EventBus`                                                    | Decouple reporter from notification channels             |
| [Factory](#factory)                               | `ChannelFactory`, `Form`                                      | Create objects without exposing construction logic       |
| [Facade](#facade)                                 | `Mail`, `Commands`, `ApiCommands`                             | Simplify complex subsystems behind one class             |
| [Dependency Injection](#dependency-injection)     | Playwright fixtures                                           | Tests declare dependencies, fixtures provide             |
| [Controller (Service Layer)](#controller-pattern) | `BaseService` → `TokensService`                               | One service per API resource                             |
| [Fluent Interface](#fluent-interface)             | `BaseService.setToken()`, `BaseControl.withText()`            | Method chaining for configuration                        |
| [Command](#command)                               | `Commands`, `ApiCommands`                                     | Encapsulate multi-step test operations                   |
| [Inheritance Hierarchy](#inheritance-hierarchy)   | `BaseControl` → `Clickable` / `Editable` → `Button` / `Input` | Layer behavior by category                               |
| [Adapter](#adapter)                               | Helpers, `Context`                                            | Wrap third-party APIs into framework-specific interfaces |

---

## Singleton

**Files:** [`src/common/browser.ts`](../../src/common/browser.ts)

`BrowserInstance` uses a private constructor and static state to ensure a single browser, context, and page per
Playwright worker process.

```ts
export class BrowserInstance {
    private static _browser: Browser | undefined;
    private static _currentPage: Page | undefined;
    private constructor() {}

    static get currentPage(): Page { ... }
    static withPage(page: Page): void { ... }
}
```

**Why Singleton here:** Playwright runs each worker as a separate Node process, and tests within a worker run
sequentially. A static instance is the simplest correct approach — no need for a more complex scoping mechanism.

**Trade-off:** Static state is global. If Playwright ever runs tests concurrently within a worker, this would need to be
replaced with per-test fixture injection.

---

## Composition

**Files:** [`src/pages/sign-in/index.ts`](../../src/pages/sign-in/index.ts),
[`src/components/containers/`](../../src/components/containers/),
[`src/components/form.component.ts`](../../src/components/form.component.ts)

Pages are composed from container objects, not built as flat monoliths. Each container scopes its elements to a parent
locator.

```
SignInPage
├── SignInHeaderContainer    (logo, title)
├── SignInMainContainer      (form, inputs, buttons)
└── SignInFooterContainer    (links)
```

```ts
export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;

    constructor() {
        this.header = new SignInHeaderContainer();
        this.main = new SignInMainContainer();
        this.footer = new SignInFooterContainer();
    }
}
```

Containers themselves compose `Form`, which composes `Input` and `Button`:

```ts
export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;

    readonly txtEmail: Input;
    readonly btnLogin: Button;

    constructor() {
        this.container = $('main');
        this.form = new Form(this.container);
        this.txtEmail = this.form.getInput({ label: 'Email' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });
    }
}
```

**Why Composition:** A header redesign touches `header.container.ts` — the main container and page object don't change.
Containers are reusable across pages. This mirrors how frontend frameworks (React, Vue) decompose UIs.

**Related:** [ADR-001](../decisions/ADR-001-container-based-page-objects.md)

---

## Template Method

**Files:** [`src/notifications/channels/base.channel.ts`](../../src/notifications/channels/base.channel.ts),
[`src/elements/base/base-control.ts`](../../src/elements/base/base-control.ts)

An abstract class defines the algorithm skeleton; subclasses implement specific steps.

```ts
export abstract class BaseChannel {
    async handle(payload: NotificationPayload): Promise<void> {
        if (!this.config.enabled) return; // ← invariant step
        if (this.config.onlyOnFailure && payload.summary.failed === 0) return; // ← invariant step
        await this.send(payload); // ← subclass step
    }

    protected abstract send(payload: NotificationPayload): Promise<void>;
}
```

Every channel (`SlackChannel`, `TeamsChannel`, `EmailChannel`, `WebhookChannel`) implements only `send()`. The guard
logic (enabled check, onlyOnFailure) is defined once in the base class.

Similarly, `BaseControl` defines common element operations (visibility, text, attributes), while `Clickable` and
`Editable` add interaction-specific methods.

**Why Template Method:** Guarantees that guard checks always run regardless of which channel is added. New channels
can't accidentally skip the `enabled` check.

---

## Strategy

**Files:** [`src/notifications/channels/`](../../src/notifications/channels/)

Each notification channel implements a different delivery strategy with platform-specific formatting:

| Channel          | Strategy                           |
| ---------------- | ---------------------------------- |
| `SlackChannel`   | Slack Block Kit + Incoming Webhook |
| `TeamsChannel`   | MessageCard format + Connector URL |
| `EmailChannel`   | HTML table formatting + Email API  |
| `WebhookChannel` | Raw JSON payload + Bearer auth     |

All share the same interface (`BaseChannel.send()`), so the `EventBus` treats them uniformly. Adding a new platform
means adding one class — no `if/else` chains.

**Why Strategy:** The notification delivery logic varies per platform but the selection and invocation are identical.
Strategies are selected at configuration time, not runtime branching.

---

## Observer

**Files:** [`src/notifications/event-bus.ts`](../../src/notifications/event-bus.ts),
[`src/notifications/notification-manager.ts`](../../src/notifications/notification-manager.ts)

`EventBus` decouples the reporter (producer) from notification channels (consumers) via a publish/subscribe mechanism.

```ts
export class EventBus {
    private static readonly subscribers = new Map<NotificationEvent, EventHandler[]>();

    static subscribe(event: NotificationEvent, handler: EventHandler): void { ... }
    static async publish(event: NotificationEvent, payload: NotificationPayload): Promise<void> {
        const handlers = EventBus.subscribers.get(event) ?? [];
        await Promise.allSettled(handlers.map(handler => handler(payload)));
    }
}
```

**Flow:** `NotificationReporter` (producer) → `EventBus.publish('suite:finished')` → all subscribed channels fire
independently.

**Why Observer:** The reporter doesn't know which channels exist. Channels don't know about the reporter. Adding a
channel requires zero changes to existing code. `Promise.allSettled` ensures one failure doesn't block others.

**Related:** [ADR-006](../decisions/ADR-006-observer-pattern-notifications.md)

---

## Factory

**Files:** [`src/notifications/channel-factory.ts`](../../src/notifications/channel-factory.ts),
[`src/components/form.component.ts`](../../src/components/form.component.ts)

### ChannelFactory

Creates channel instances from a config type string:

```ts
const channelMap: Record<string, new (config) => BaseChannel> = {
    slack: SlackChannel,
    teams: TeamsChannel,
    email: EmailChannel,
    webhook: WebhookChannel
};

export class ChannelFactory {
    static create(config: NotificationChannelConfig): BaseChannel {
        const Channel = channelMap[config.type];
        return new Channel(config);
    }
}
```

### Form Component (Factory Methods)

`Form.getInput()` and `Form.getButton()` are factory methods that create and cache element instances:

```ts
export class Form {
    getInput(option: { label?: string; ... }): Input {
        const cacheKey = stableCacheKey(option);
        if (!this.inputCache.has(cacheKey)) {
            this.inputCache.set(cacheKey, new Input({ parentLocator: this.form, ...option }));
        }
        return this.inputCache.get(cacheKey);
    }
}
```

**Why Factory:** Centralizes object creation. Adding a new channel type is one line in `channelMap`. The `Form` factory
also caches instances to avoid duplicate locator resolution.

---

## Facade

**Files:** [`src/mail/mail.ts`](../../src/mail/mail.ts), [`src/commands/commands.ts`](../../src/commands/commands.ts),
[`src/commands/api-commands.ts`](../../src/commands/api-commands.ts)

### Mail

The `Mail` class hides three internal components behind a single interface:

```
Mail (facade)
├── MailApiClient      → HTTP calls to mail API
├── MailContentParser  → HTML parsing with Cheerio
└── MailWaiter         → Polling with retry logic
```

Tests call `mail.extractToken(email, subject)` — they don't know about HTTP, Cheerio, or retry loops.

### Commands / ApiCommands

Multi-step test operations wrapped as single method calls:

```ts
// Instead of: goto sign-in page → fill email → fill password → click login
await commands.loginWithUser('admin@example.com');

// Instead of: create service → call signIn → extract token
const token = await apiCommands.getAuthorizationToken(email);
```

**Why Facade:** Tests shouldn't know the internal steps of logging in or extracting email tokens. The facade hides
complexity and makes tests read like specifications.

---

## Dependency Injection

**Files:** [`src/fixtures/`](../../src/fixtures/)

Playwright fixtures implement DI — tests declare what they need, the framework provides it:

```ts
// Registration (service-fixtures.ts)
export const test = base.extend<Services>({
    tokensService: async ({}, use) => {
        await use(new TokensService());
    }
});

// Consumption (test file)
test('should create token', async ({ tokensService, apiCommands }) => {
    // tokensService and apiCommands are injected — not constructed
});
```

All fixtures are merged in [`fixtures.ts`](../../src/fixtures/fixtures.ts):

```ts
export const test = mergeTests(serviceFixtures, commandFixtures, pageFixtures, notificationFixtures, hookFixtures);
export const expect = mergeExpects(expectFixtures);
```

**Why DI:** Tests don't construct their dependencies. Swapping implementations (e.g., mock services) means changing the
fixture, not every test. This is the same principle as NestJS providers or Spring beans.

**Related:** [ADR-002](../decisions/ADR-002-custom-fixtures.md)

---

## Controller Pattern

**Files:** [`src/services/base.service.ts`](../../src/services/base.service.ts),
[`src/services/tokens.service.ts`](../../src/services/tokens.service.ts),
[`src/services/user-organization.service.ts`](../../src/services/user-organization.service.ts)

Each service class maps to one backend controller / Swagger tag:

```
Swagger tag: "Tokens"    →  TokensService
  GET    /tokens         →  tokensService.getAll()
  POST   /tokens         →  tokensService.create(body)
  DELETE /tokens/{id}    →  tokensService.deleteById(id)
```

`BaseService` handles URL construction, token management, header merging, and typed responses via `send<T>()`.

**Why Controller Pattern:** Swagger-to-code conversion becomes mechanical. New endpoint = one method in one file. Types
live in `@models/`, separate from services — matching backend DTO conventions.

---

## Fluent Interface

**Files:** [`src/services/base.service.ts`](../../src/services/base.service.ts),
[`src/elements/base/base-control.ts`](../../src/elements/base/base-control.ts)

Methods return `this` to allow chaining:

```ts
// Service configuration
const service = new TokensService().setToken(token).setHeaders({ 'X-Custom': 'value' });

// Element refinement
const row = table.getRow().withText('John').withIndex(0);
```

**Why Fluent Interface:** Reduces boilerplate for multi-step configuration. Each method is independently useful but
chains naturally.

---

## Command

**Files:** [`src/commands/commands.ts`](../../src/commands/commands.ts),
[`src/commands/api-commands.ts`](../../src/commands/api-commands.ts)

Complex multi-step operations encapsulated as reusable methods:

```ts
export class Commands {
    async loginWithUser(email: string, password = PASSWORD): Promise<void> {
        await BrowserInstance.currentPage.goto(ENDPOINTS.SIGN_IN);
        await this.signInPage.signIn(email, password);
    }
}

export class ApiCommands {
    async getAuthorizationToken(email: string): Promise<string> {
        const { data } = await this.userOrganizationService.signIn({ email, password });
        return data.token;
    }
}
```

**Why Command:** Tests call `commands.loginWithUser()` instead of repeating navigation + form fill + click sequences.
The operation is defined once and reused across the entire suite.

---

## Inheritance Hierarchy

**Files:** [`src/elements/base/`](../../src/elements/base/), [`src/elements/common/`](../../src/elements/common/)

Elements follow a layered hierarchy where each level adds one category of behavior:

```
BaseControl          → visibility, text, attributes, waiters (read-only)
├── Clickable        → click, doubleClick, hover, download (interaction)
│   ├── Button       → click specialization
│   ├── Link         → navigation
│   ├── Checkbox     → check/uncheck
│   └── Label        → display text
├── Editable         → fill, clear, type, drag-and-drop (input)
│   ├── Input        → text input with label/placeholder resolution
│   ├── Dropdown     → select from options
│   └── DatePicker   → date selection
```

**Why Hierarchy:** A `Button` doesn't need `fill()`. An `Input` doesn't need `check()`. Each level adds exactly what's
needed — no god class that knows how to click, type, select, and pick dates all at once.

**Related:** [ADR-003](../decisions/ADR-003-solid-principles-complex-elements.md)

---

## Adapter

**Files:** [`src/helpers/helper-functions.ts`](../../src/helpers/helper-functions.ts),
[`src/common/browser.ts`](../../src/common/browser.ts)

Wrappers that adapt third-party APIs to framework-specific interfaces:

| Adapter             | Wraps                       | Exposes                                |
| ------------------- | --------------------------- | -------------------------------------- |
| `ResponseHelper`    | Playwright `APIResponse`    | `.toJson<T>()`, `.waitFor()`           |
| `Context`           | Playwright `BrowserContext` | Page stack, mobile detection           |
| `StringHelper`      | `html-entities`             | `.decodeHtml()`                        |
| `MailContentParser` | `cheerio`                   | `.extractToken()`, `.getTextContent()` |

**Why Adapter:** Tests and framework code don't depend directly on third-party APIs. If `cheerio` is replaced, only
`MailContentParser` changes.

---

## Pattern Interactions

The patterns don't exist in isolation — they reinforce each other:

```
Test file
│   imports test/expect from fixtures (DI)
│   receives services (Controller) and pages (Composition) as parameters
│
├── Page Object (Composition)
│   ├── Container → Form (Factory) → Input/Button (Hierarchy)
│   └── Exposes business methods (Facade)
│
├── Service (Controller)
│   ├── BaseService.send<T>() (Template Method)
│   └── .setToken().setHeaders() (Fluent Interface)
│
├── Commands (Command + Facade)
│   └── loginWithUser(), getAuthorizationToken()
│
└── Reporter (Observer)
    ├── EventBus.publish() → channels subscribe
    ├── ChannelFactory.create() (Factory)
    ├── BaseChannel.handle() (Template Method)
    └── Slack/Teams/Email/Webhook (Strategy)
```

## When to Apply Each Pattern

| Situation                                 | Pattern                    | Example                                       |
| ----------------------------------------- | -------------------------- | --------------------------------------------- |
| Need a new page object                    | Composition                | Page → Header/Main/Footer containers          |
| Need a new API service                    | Controller                 | Extend `BaseService`, one method per endpoint |
| Need a new notification channel           | Strategy + Template Method | Extend `BaseChannel`, implement `send()`      |
| Need a reusable multi-step operation      | Command + Facade           | Add method to `Commands` or `ApiCommands`     |
| Need a new UI element type                | Hierarchy                  | Extend `Clickable` or `Editable`              |
| Need to decouple producers from consumers | Observer                   | Subscribe to `EventBus` events                |
| Need to create instances from config      | Factory                    | Add to factory map                            |

## Related

-   [ADR-001 — Container-based page objects](../decisions/ADR-001-container-based-page-objects.md)
-   [ADR-002 — Custom fixtures](../decisions/ADR-002-custom-fixtures.md)
-   [ADR-003 — SOLID principles for elements](../decisions/ADR-003-solid-principles-complex-elements.md)
-   [ADR-004 — YAGNI/KISS/DRY principles](../decisions/ADR-004-yagni-kiss-dry-principles.md)
-   [ADR-006 — Observer pattern for notifications](../decisions/ADR-006-observer-pattern-notifications.md)
