# Guidance

Practical framework guidance for common patterns and conventions.

## Topics

### Authentication & Authorization

-   [Auth Storage & Role Switching](./auth-storage.md) — storageState, `logout()`, `switchRole()`

### Elements

-   [Cascading Dropdown](./cascading-dropdown.md) — multi-level menu with separate popover panels
-   [Skeleton Loading Element](./skeleton.md)

### Testing Patterns

-   [Custom Expect Matchers](./expect.md)
-   [Behavior-Style Testing (test.step + typed DSL)](./behavior-testing.md)
-   [BDD with Gherkin and playwright-bdd](./bdd.md) — conditional; only if stakeholders author features
-   [PDF Testing](./pdf-testing.md) — download, text, tables, forms, visual snapshots
-   [Word Document Testing](./word-testing.md) — text, headings, tables, images, templates

### Framework Patterns

-   [Message Constants](./messages.md)
-   [Centralized Notifications](./notifications.md)
-   [CI Result Notifications](./notifications-ci.md) — Observer pattern (Slack, Teams, email)
-   [Multiple Sections Container Pattern](./sections.md)
-   [Design Patterns](./design-patterns.md)
-   [Health Locator with RAG](./health-locator-rag.md)
-   [Prompt Library](./prompts.md) — reusable AI prompts for common tasks in this repo

## Purpose

Use these guides when implementing or reviewing framework patterns that affect test readability and maintainability.
