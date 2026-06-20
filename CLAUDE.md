# Playwright POC - Project Context for Claude

## Project Overview

Playwright-based test automation framework using TypeScript with Page Object Model architecture. Includes E2E and API
testing with custom fixtures, reusable elements, and service layers.

**Tech Stack:** Playwright 1.51.1, TypeScript 5.8.2, Report Portal, ESLint, Prettier

## Critical Rules

### ✅ ALWAYS Read Skills Before Writing Code

Before writing or modifying ANY code in this repo, read the relevant skill(s) under
[`.claude/skills/`](.claude/skills/README.md) and follow the patterns they document.
The skills are the source of truth for how this framework is built — they capture
conventions that don't always show in the existing code (e.g. parent-scoping rules,
toast vs inline error, Form component usage).

**Quick lookup by task:**

| Task                              | Skill to read first                                                   |
| --------------------------------- | --------------------------------------------------------------------- |
| Build / update a page object      | [create-page-object.md](.claude/skills/create-page-object.md)         |
| Add a new UI element class        | [create-custom-element.md](.claude/skills/create-custom-element.md)   |
| Add an API service                | [create-api-service.md](.claude/skills/create-api-service.md)         |
| Write an E2E test                 | [write-e2e-test.md](.claude/skills/write-e2e-test.md)                 |
| Write an API test                 | [write-api-test.md](.claude/skills/write-api-test.md)                 |
| Discover locators on a new screen | [explore-screens.md](.claude/skills/explore-screens.md)               |
| Turn a user story into test cases | [generate-test-cases.md](.claude/skills/generate-test-cases.md)       |
| Email verification flows          | [work-with-email.md](.claude/skills/work-with-email.md)               |
| Authentication / session reuse    | [use-auth-state.md](.claude/skills/use-auth-state.md)                 |
| Network mocking                   | [mock-network.md](.claude/skills/mock-network.md)                     |
| Test data setup / cleanup         | [manage-test-data.md](.claude/skills/manage-test-data.md)             |

**Non-negotiable patterns from skills (highest-impact):**

-   **Parent scoping** — every element must resolve through a parent `Locator`, even
    when it has a `data-testid`. Same testid can appear elsewhere on the page
    (modals, hidden tabs, prerendered routes). Page-global `$getByTestId(...)` is a
    flakiness source.
-   **`Form` component** — when a container has form elements, use
    `new Form(this.container)` + `form.getInput()` / `form.getButton()`. Never wire
    inputs page-globally.
-   **Centralized `notification` fixture** — error and success messages are read from
    the `notification` fixture (see [docs/guidance/notifications.md](docs/guidance/notifications.md)).
    Do **not** add per-page `toast` properties or `lblError` elements that duplicate this.
-   **Custom fixtures** — import `test`/`expect` from `@fixtures/fixtures`, never from
    `@playwright/test`.

If a skill is silent on what you need, do not invent a pattern — flag it and ask.

### ✅ ALWAYS Use Custom Fixtures

```ts
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER: import { expect, test } from '@playwright/test';
```

### ✅ Follow SOLID & Clean Code

- **SOLID:** Single responsibility, Open/Closed, Liskov substitution, Interface segregation, Dependency inversion
- **YAGNI:** You Aren't Gonna Need It - write only code needed for current requirements
- **KISS:** Keep It Simple, Stupid - prefer simple solutions over complex ones
- **DRY:** Don't Repeat Yourself - extract repeated logic into reusable functions
- Descriptive names, no magic numbers
- Keep functions small, avoid deep nesting
- Use static methods for utilities
- Prefer composition over inheritance

## Project Structure

```
src/
├── pages/           # Page Objects
├── elements/        # UI elements (Button, Input, Dropdown)
├── components/      # Composite components (Table)
├── models/          # TypeScript interfaces
├── services/        # API services
├── fixtures/        # Test fixtures (merged)
├── helpers/         # Utility classes
├── constants/       # Config and constants
├── enums/           # Enumerations
├── mail/            # Email utilities
└── common/          # Shared utilities

tests/
├── e2e/            # E2E tests
└── api/            # API tests
```

## Path Aliases

| Alias           | Maps To            | Usage            |
| --------------- | ------------------ | ---------------- |
| `@pages/*`      | `src/pages/*`      | Page objects     |
| `@elements/*`   | `src/elements/*`   | UI elements      |
| `@components/*` | `src/components/*` | Components       |
| `@models/*`     | `src/models/*`     | Types/interfaces |
| `@services/*`   | `src/services/*`   | API services     |
| `@fixtures/*`   | `src/fixtures/*`   | Test fixtures    |
| `@helpers/*`    | `src/helpers/*`    | Utilities        |
| `@constants/*`  | `src/constants/*`  | Config/constants |
| `@enums/*`      | `src/enums/*`      | Enums            |
| `@common/*`     | `src/common/*`     | Shared utilities |

## Architecture

### Element Hierarchy

-   **BaseControl** → Common operations (visibility, text, attributes)
-   **Clickable** → Extends BaseControl for clickable elements
-   **Editable** → Extends BaseControl for inputs
-   **Specialized** → Button, Input, Dropdown, Checkbox, etc.

### Key Patterns

-   **Page Objects** - Encapsulate page elements and actions
-   **Fixtures** - Centralized in `src/fixtures/fixtures.ts`, merged with `mergeTests()` and `mergeExpects()`
-   **Services** - Extend `BaseService` for API operations
-   **Browser Management** - Singleton `BrowserInstance` with page switching support

## Constants Organization

### Config (`@constants/config.constant`)

```ts
Config.report.apiKey;
Config.api.domain;
Config.auth.password;
Config.app.baseUrl;
```

### Common (`@constants/common.constant`)

```ts
Paths.downloads, Paths.files;
Timeouts.long;
Pagination.defaultPerPage;
DateFormats.dayMonthYear;
```

### Endpoints (`@constants/endpoints.constant`)

```ts
Endpoints.auth.signIn;
Endpoints.api.users;
```

## Helper Classes

### DateTimeHelper

```ts
DateTimeHelper.today();
DateTimeHelper.addDays(7);
DateTimeHelper.toUnix(date);
```

### ExcelHelper

```ts
ExcelHelper.open('file.xlsx', 'Sheet1').getRowAsJson(2).getRowsAsJson(2, 10);
```

### DataGenerator

```ts
DataGenerator.randomEmail();
DataGenerator.randomName();
DataGenerator.randomNumber(1, 100);
```

### ArrayHelper, StringHelper, ResponseHelper, FileHelper

See `@helpers/*` for utility methods.

## Browser Instance

```ts
BrowserInstance.currentPage; // Current active page
await BrowserInstance.startNewPage(); // Open new page (saves current to stack)
await BrowserInstance.switchToPreviousPage(); // Pop from stack
BrowserInstance.switchToPage(page); // Switch to specific page
await BrowserInstance.switchToTabByIndex(0); // Switch by index
```

## Key Files

-   **playwright.config.ts** - Playwright configuration, multiple browser projects
-   **src/fixtures/fixtures.ts** - Central fixture registry
-   **src/common/browser.ts** - Browser instance management
-   **tsconfig.json** - Path aliases configuration

## When Working on This Project

1. **Read docs first** - Check `docs/` before making changes:
   - `docs/test-cases/` - Manual test cases per feature (read before writing specs)
   - `docs/decisions/` - ADRs (read before changing patterns)
   - `docs/guidance/` - Pattern guidance (read before applying a pattern)
2. **Use skills files** - Reference `.claude/skills/*.md` for detailed guidance
3. **Match existing patterns** - Follow established conventions
4. **Use path aliases** - Never use relative imports
5. **Extend fixtures** - Register new page objects and services in fixtures
6. **Follow SOLID** - Keep code clean, single responsibility
7. **Import from fixtures** - Always use `@fixtures/fixtures` for test/expect

## Documentation Structure

Start at [docs/README.md](docs/README.md) for the documentation index.

```
docs/
├── README.md              # Documentation landing page
├── decisions/             # Architecture Decision Records (immutable)
│   ├── ADR-001-container-based-page-objects.md
│   ├── ADR-002-custom-fixtures.md
│   ├── ADR-003-solid-principles-complex-elements.md
│   └── ADR-004-yagni-kiss-dry-principles.md
├── guidance/              # Practical pattern guidance (one file per topic)
│   ├── expect.md          # Custom expect matchers
│   ├── messages.md        # NotificationMessages constants
│   ├── notifications.md   # Centralized notification fixture
│   ├── sections.md        # Multi-section container pattern
│   └── skeleton.md        # Skeleton loading element
├── examples.md            # Quick-reference code snippets
├── user-stories/          # User stories (one .md per feature; source for generate-test-cases)
├── test-cases/            # Manual test cases (traces back to AC IDs in user-stories/)
├── ci/                    # CI templates (GitHub Actions, GitLab CI)
└── troubleshooting/       # common-errors.md, debugging-tips.md, faq.md
```

### When to read what
- **Before changing architecture** → `decisions/` (ADRs document the why behind patterns)
- **Before using a pattern** → `guidance/<topic>.md` (what the pattern is and when to apply it)
- **Need a starting snippet** → `examples.md`
- **Need a step-by-step recipe** → [`.claude/skills/`](.claude/skills/README.md) (skills are how-to, guidance is what/why)
- **Test is failing or behaving oddly** → `troubleshooting/`

### Rules
- ADRs are append-only. Supersede with a new ADR; never edit an accepted one.
- Guidance files are one-pattern-per-file. Link siblings in `## Related`; don't duplicate content.
- Skills vs guidance: skills tell you _how_ to build something, guidance explains _what_ a pattern is and _when_ to use it.

## Available Skills

Start at [`.claude/skills/README.md`](.claude/skills/README.md) for the skills index grouped by purpose.

**Discovery**
-   `explore-screens.md` - Inspect a live screen, capture UI locators + API endpoints in one pass
-   `generate-test-cases.md` - User story → exploration → `docs/test-cases/<feature>.md`

**Creation**
-   `create-page-object.md` - Container-based page object (Header/Main/Footer)
-   `create-custom-element.md` - Extend BaseControl / Clickable / Editable
-   `create-api-service.md` - Service class extending BaseService

**Writing tests**
-   `write-e2e-test.md` - E2E test with custom fixtures
-   `write-api-test.md` - API test with custom fixtures

**Test infrastructure**
-   `use-auth-state.md` - Log in once, reuse session via Playwright `storageState`
-   `mock-network.md` - Intercept HTTP with `page.route()` for edge-case coverage
-   `manage-test-data.md` - Factories + auto-cleanup fixture for isolated state

**Cross-cutting workflows**
-   `use-helper-functions.md` - DateTimeHelper, DataGenerator, ExcelHelper, etc.
-   `work-with-email.md` - Email verification via `Mail` and `MailSubjects`
