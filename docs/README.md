# Documentation

Welcome to the Playwright POC documentation. Pick the right entry point for what you're doing.

## I want to…

| Goal                                                   | Read                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Understand the project at a glance                     | [../CLAUDE.md](../CLAUDE.md) and [../CONTEXT.md](../CONTEXT.md)                        |
| Know **why** the framework is shaped the way it is     | [decisions/](./decisions/) — Architecture Decision Records                            |
| Use a specific pattern correctly                       | [guidance/](./guidance/) — practical guides per pattern                               |
| Copy a working snippet to start from                   | [examples.md](./examples.md)                                                          |
| Build a new page object, service, element, or test     | [`../.claude/skills/`](../.claude/skills/README.md)                                    |
| Run tests in CI                                        | [ci/](./ci/) — GitHub Actions and GitLab CI templates                                 |
| See all pages and services at a glance                 | [registry/](./registry/) — living inventory of pages & services                       |
| Debug a failing test or unclear error                  | [troubleshooting/](./troubleshooting/)                                                |
| Document a user story                                  | [user-stories/](./user-stories/) — one file per feature                               |
| Document a manual test case                            | [test-cases/](./test-cases/) — one file per feature, traces back to AC IDs            |

## Map

```
docs/
├── README.md              # this file
├── decisions/             # Architecture Decision Records (immutable)
├── guidance/              # one-topic-per-file practical guidance
│   ├── expect.md          # custom expect matchers
│   ├── messages.md        # NotificationMessages constants
│   ├── notifications.md   # centralized notification fixture
│   ├── sections.md        # multi-section container pattern
│   └── skeleton.md        # skeleton loading element
├── registry/              # living inventory of pages & services
│   ├── pages.md           # all page objects
│   └── services.md        # all API services
├── examples.md            # quick-reference code snippets
├── user-stories/          # user stories (AC tables); source for generate-test-cases
├── test-cases/            # manual test cases (one .md per feature, traces to AC IDs)
├── ci/                    # CI pipeline templates
└── troubleshooting/       # errors, debugging, FAQ
```

## Conventions

-   **`decisions/`** — append-only ADRs. Never edit an accepted ADR; supersede with a new one.
-   **`guidance/`** — one file per pattern. Keep files focused; link sibling files in a `## Related` section instead of duplicating.
-   **Skills vs guidance** — skills (`.claude/skills/*.md`) tell you _how_ to build something step-by-step; guidance explains _what_ a pattern is and _when_ to use it.
-   **Path references** — when a doc cites code, use the path alias (`@elements/common/input`) so search and tooling resolve it.
