# Playwright POC - Project Context for Claude

## Project Overview

Playwright-based test automation framework using TypeScript with Page Object Model architecture. Includes E2E and API
testing with custom fixtures, reusable elements, and service layers.

**Tech Stack:** Playwright 1.51.1, TypeScript 5.8.2, Report Portal, ESLint, Prettier

## Critical Rules

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
   - `docs/test-cases/` - Manual test cases (read before writing specs)
   - `docs/decisions/` - ADRs (read before changing patterns)
2. **Use skills files** - Reference `.claude/skills/*.md` for detailed guidance
3. **Match existing patterns** - Follow established conventions
4. **Use path aliases** - Never use relative imports
5. **Extend fixtures** - Register new page objects and services in fixtures
6. **Follow SOLID** - Keep code clean, single responsibility
7. **Import from fixtures** - Always use `@fixtures/fixtures` for test/expect

## Documentation Structure

```
docs/
├── test-cases/          # Manual test cases in Markdown
│   └── README.md        # Test case format and guidelines
└── decisions/           # Architecture Decision Records (ADRs)
    ├── README.md        # ADR format and guidelines
    ├── ADR-001-container-based-page-objects.md
    ├── ADR-002-custom-fixtures.md
    └── ADR-003-solid-principles-complex-elements.md
```

### Test Cases
- Read before automating to understand business requirements
- Reference test case IDs in automated specs
- Include preconditions, steps, expected results

### Architecture Decision Records (ADRs)
- Read before changing architectural patterns
- Document context, decision, consequences, alternatives
- Keep immutable - create new ADRs to supersede old ones

## Available Skills

-   `create-page-object.md` - Page Object creation guide
-   `create-custom-element.md` - Custom element extension
-   `create-api-service.md` - API service creation
-   `write-e2e-test.md` - E2E test writing
-   `write-api-test.md` - API test writing
-   `use-helper-functions.md` - Helper utilities reference
-   `work-with-email.md` - Email verification and mail testing
