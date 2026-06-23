# Playwright Test Automation Framework

A scalable, maintainable Playwright-based test automation framework using TypeScript with SOLID principles,
container-based architecture, and controller-pattern API services.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run API tests
npm run test:api

# Run tests tagged @new
npm run test:new

# Lint & format
npm run lint
npm run format
```

## Tech Stack

| Tool          | Version | Purpose                                                     |
| ------------- | ------- | ----------------------------------------------------------- |
| Playwright    | 1.61.0  | Browser automation & API testing                            |
| TypeScript    | 5.8.2   | Type safety                                                 |
| date-fns      | 4.x     | Date/time utilities                                         |
| ESLint        | 9.x     | Linting (typescript-eslint flat config + playwright plugin) |
| Prettier      | 3.x     | Code formatting                                             |
| Report Portal | 5.x     | CI test reporting                                           |

## Project Structure

```
playwright-poc/
├── .claude/skills/             # How-to guides for common tasks
├── docs/
│   ├── decisions/              # Architecture Decision Records (ADRs)
│   ├── guidance/               # Pattern guidance (expect, notifications, sections, skeleton)
│   ├── test-cases/             # Manual test cases per feature
│   ├── user-stories/           # User stories per feature
│   ├── ci/                     # CI templates (GitHub Actions, GitLab CI)
│   ├── troubleshooting/        # Common errors, debugging, FAQ
│   └── examples.md             # Quick-reference code examples
├── src/
│   ├── pages/                  # Page objects (folder + index.ts per page)
│   ├── components/
│   │   ├── containers/         # Page section containers (Header, Main, Footer)
│   │   ├── form.component.ts   # Form element factory (cached inputs/buttons)
│   │   ├── table.component.ts  # Table navigation, sorting, cell access
│   │   ├── modal.component.ts  # Modal dialog abstraction
│   │   └── notification.component.ts
│   ├── elements/
│   │   ├── base/               # BaseControl, Clickable, Editable
│   │   └── common/             # Button, Input, Dropdown, Label, Link, etc.
│   ├── services/               # API services (controller pattern)
│   ├── models/                 # TypeScript interfaces (per module)
│   ├── fixtures/               # Test fixtures (merged via mergeTests)
│   ├── helpers/                # DateTimeHelper, DataGenerator, ExcelHelper, etc.
│   ├── constants/              # Config, endpoints, messages
│   ├── enums/                  # ElementState, ElementRole, SortDirection
│   ├── commands/               # High-level API commands (auth tokens, etc.)
│   ├── mail/                   # Email verification utilities
│   ├── common/                 # BrowserInstance, element selector functions
│   └── data/                   # Test data, JSON schemas, mock fixtures
├── tests/
│   ├── e2e/                    # E2E tests
│   └── api/                    # API tests
├── CLAUDE.md                   # AI assistant context & project rules
├── playwright.config.ts        # Playwright config (parallel, multi-browser)
└── tsconfig.json               # TypeScript config with path aliases
```

## Architecture

### Container-Based Page Objects

Pages are composed of reusable containers that mirror frontend structure:

```typescript
export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;

    async signIn(email: string, password: string): Promise<void> {
        await this.main.fillCredentials(email, password);
        await this.main.btnLogin.click();
    }
}
```

Each container scopes elements through a parent `Locator` — no page-global selectors.

### Controller-Pattern API Services

Services map 1:1 to backend controllers. Methods return typed `ServiceResponse<T>`:

```typescript
export class UsersService extends BaseService {
    constructor() {
        super('/users');
    }

    async getAll(): Promise<ServiceResponse<User[]>> {
        return await this.send<User[]>('get');
    }

    async create(body: CreateUserRequest): Promise<ServiceResponse<User>> {
        return await this.send<User>('post', { body });
    }

    async deleteById(id: string): Promise<ServiceResponse<void>> {
        return await this.send<void>('delete', { id });
    }
}
```

Token is set once, not per method:

```typescript
usersService.setToken(token);
const { statusCode, data } = await usersService.getById(id);
// data is already typed as User
```

### Custom Fixtures

Type-safe dependency injection — always import from `@fixtures/fixtures`:

```typescript
import { expect, test } from '@fixtures/fixtures';

test('login test', async ({ signInPage, notification }) => {
    await signInPage.signIn('user@example.com');
    await expect(signInPage.main.btnLogin).toBeVisible();
    expect(await notification.getMessage()).toContain('Welcome');
});
```

### Element System

All elements extend `BaseControl` → `Clickable` / `Editable`. Every element supports locating by `id`:

```typescript
// By id (most stable)
new Button({ parentLocator: container, id: 'submit-btn' });

// By label
new Input({ parentLocator: container, label: 'Email' });

// Via Form component (cached)
const form = new Form(container);
form.getInput({ label: 'Email' });
form.getButton({ id: 'submit' });
```

Custom expect matchers work directly on elements — no `.element` needed:

```typescript
await expect(signInPage.main.btnLogin).toBeVisible();
await expect(signInPage.main.txtEmail).toBeEnabled();
await expect(signInPage.header.lblTitle).toHaveText('Sign In');
await expect(signInPage.main.txtPassword).toHaveAttribute('type', 'password');
```

## Path Aliases

| Alias           | Maps To            | Usage                                   |
| --------------- | ------------------ | --------------------------------------- |
| `@pages/*`      | `src/pages/*`      | Page objects                            |
| `@elements/*`   | `src/elements/*`   | UI elements                             |
| `@components/*` | `src/components/*` | Containers & components                 |
| `@models/*`     | `src/models/*`     | TypeScript interfaces                   |
| `@services/*`   | `src/services/*`   | API services                            |
| `@fixtures/*`   | `src/fixtures/*`   | **Always import test/expect from here** |
| `@helpers/*`    | `src/helpers/*`    | Utility classes                         |
| `@constants/*`  | `src/constants/*`  | Config & constants                      |
| `@enums/*`      | `src/enums/*`      | Enumerations                            |
| `@common/*`     | `src/common/*`     | Shared utilities                        |
| `@mail/*`       | `src/mail/*`       | Email utilities                         |
| `@data/*`       | `src/data/*`       | Test data & schemas                     |

## Quick Examples

### E2E Test

```typescript
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Sign In', () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
    });

    test('should sign in successfully', async ({ signInPage, notification }) => {
        await signInPage.signIn('user@example.com');

        await expect(signInPage.main.btnLogin).toBeVisible();
        await expect(signInPage.header.lblTitle).toHaveText('Sign In');
    });
});
```

### API Test

```typescript
import { Config } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';

test.describe('Users API', () => {
    test('should create user', async ({ usersService, apiCommands }) => {
        const token = await apiCommands.getAuthorizationToken(Config.auth.superAdminEmail);
        usersService.setToken(token);

        const { statusCode, data } = await usersService.create({
            name: 'John Doe',
            email: 'john@example.com'
        });

        expect(statusCode).toBe(StatusCodes.CREATED);
        expect(data.email).toBe('john@example.com');
    });
});
```

## Test Execution

```bash
# Run all tests (parallel — 2 workers local, 4 in CI)
npx playwright test

# Run specific project
npm run test:e2e
npm run test:api
npm run test:new          # Tests tagged @new

# Run headed (visible browser)
npx playwright test --headed

# Run specific file
npx playwright test tests/e2e/auth/sign-in.spec.ts

# Debug mode
npx playwright test --debug

# Enable API request logging
DEBUG_API=true npm run test:api
```

## Creating New Components

### Page Object

```
src/components/containers/my-page/
├── header.container.ts
├── main.container.ts
└── footer.container.ts

src/pages/my-page/index.ts        # Composes containers
src/fixtures/page-fixtures.ts     # Register fixture
```

See [.claude/skills/create-page-object.md](.claude/skills/create-page-object.md)

### API Service

```
src/models/users/users.interface.ts   # Request/response types
src/services/users.service.ts         # Extends BaseService
src/fixtures/service-fixtures.ts      # Register fixture
```

See [.claude/skills/create-api-service.md](.claude/skills/create-api-service.md) or
[.claude/skills/create-service-from-swagger.md](.claude/skills/create-service-from-swagger.md) if you have a Swagger
spec.

## Documentation

| Resource                                       | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| [CLAUDE.md](CLAUDE.md)                         | Project rules & AI assistant context |
| [docs/](docs/README.md)                        | Documentation index                  |
| [.claude/skills/](.claude/skills/README.md)    | Step-by-step how-to guides           |
| [docs/decisions/](docs/decisions/)             | Architecture Decision Records (ADRs) |
| [docs/guidance/](docs/guidance/)               | Pattern guidance per topic           |
| [docs/examples.md](docs/examples.md)           | Quick-reference code snippets        |
| [docs/troubleshooting/](docs/troubleshooting/) | Common errors, debugging tips, FAQ   |
| [docs/ci/](docs/ci/)                           | GitHub Actions & GitLab CI templates |

## Coding Standards

-   **SOLID** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
-   **YAGNI** — Don't build what you don't need yet
-   **KISS** — Prefer simple solutions
-   **DRY** — Extract repeated logic into reusable helpers

See [ADR-004](docs/decisions/ADR-004-yagni-kiss-dry-principles.md)

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) for project rules
2. Check [docs/decisions/](docs/decisions/) before changing patterns
3. Read the relevant [skill](.claude/skills/README.md) before building
4. Run `npm run lint` and `npx tsc --noEmit` before committing
5. Import `test`/`expect` from `@fixtures/fixtures`, never from `@playwright/test`

## License

MIT
