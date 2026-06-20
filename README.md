# Playwright Test Automation Framework

A scalable, maintainable Playwright-based test automation framework using TypeScript with SOLID principles and container-based architecture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run API tests
npm run test:api

# Run tests in headed mode
npx playwright test --headed
```

## 📁 Project Structure

```
playwright-poc/
├── .claude/
│   └── skills/              # How-to guides for common tasks
├── docs/
│   ├── README.md            # Documentation index
│   ├── decisions/           # Architecture Decision Records (ADRs)
│   ├── guidance/            # Practical framework guidance per pattern
│   ├── ci/                  # CI templates (GitHub Actions, GitLab CI)
│   ├── troubleshooting/     # Common errors, debugging, FAQ
│   ├── examples.md          # Quick-reference code examples
│   └── test-cases/          # Manual test cases (README + per-feature files)
├── src/
│   ├── pages/              # Page objects (orchestration layer)
│   ├── components/
│   │   ├── containers/     # Page section containers (Header, Main, Footer)
│   │   ├── form.component.ts
│   │   ├── table.component.ts
│   │   ├── modal.component.ts
│   │   └── notification.component.ts
│   ├── elements/           # Base UI elements
│   │   ├── base/           # BaseControl, Clickable, Editable
│   │   └── common/         # Button, Input, Dropdown, etc.
│   ├── services/           # API service layer
│   ├── fixtures/           # Test fixtures (merged)
│   ├── helpers/            # Utility classes
│   ├── constants/          # Config and constants
│   └── common/             # Shared utilities
├── tests/
│   ├── e2e/               # E2E tests
│   └── api/               # API tests
├── CLAUDE.md              # AI assistant context
├── CONTEXT.md             # Glossary
└── README.md              # This file
```

## 🎯 Key Features

### Container-Based Architecture
Pages are composed of reusable containers (Header, Main, Footer) that mirror frontend structure:

```typescript
export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;
}
```

### Path Aliases
Clean imports without relative paths:

```typescript
// ✅ Clean
import { SignInPage } from '@pages/sign-in';
import { Button } from '@elements/common/button';
import { Config } from '@constants/config.constant';

// ❌ Avoid
import { SignInPage } from '../../../pages/sign-in';
```

### Custom Fixtures
Type-safe dependency injection for page objects and services:

```typescript
import { test, expect } from '@fixtures/fixtures';

test('login test', async ({ signInPage, userService }) => {
    await signInPage.signIn('user@example.com');
});
```

### Helper Classes
Organized utilities with static methods:

```typescript
import { DateTimeHelper } from '@helpers/date-time-functions';
import { DataGenerator } from '@helpers/generate-data-functions';

const today = DateTimeHelper.today();
const email = DataGenerator.randomEmail('test');
```

## 📖 Path Aliases Reference

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@pages/*` | `src/pages/*` | Page objects |
| `@elements/*` | `src/elements/*` | UI elements |
| `@components/*` | `src/components/*` | Containers & components |
| `@services/*` | `src/services/*` | API services |
| `@fixtures/*` | `src/fixtures/*` | **Always import test/expect from here** |
| `@helpers/*` | `src/helpers/*` | Utility classes |
| `@constants/*` | `src/constants/*` | Config & constants |
| `@common/*` | `src/common/*` | Shared utilities |

## ✅ Critical Rules

### 1. Always Import from Custom Fixtures
```typescript
// ✅ Correct
import { test, expect } from '@fixtures/fixtures';

// ❌ Wrong - Never use
import { test, expect } from '@playwright/test';
```

### 2. Follow SOLID Principles
- Single Responsibility - One class, one purpose
- Use composition over inheritance
- Extract complex logic into helper classes

### 3. Use Existing Components
- `Form` - For form interactions
- `Table` - For table operations
- `Modal` - For modal dialogs
- `Notification` - For toast / notification messages (use via the `notification` fixture)

## 📝 Quick Examples

### E2E Test
```typescript
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Login', () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
    });
    
    test('should login successfully', async ({ signInPage }) => {
        await signInPage.signIn('user@example.com');
        await expect(await signInPage.getTitle()).toEqual('Dashboard');
    });
});
```

### API Test
```typescript
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';

test('should get user', async ({ userService, tokensService }) => {
    const { response } = await tokensService.getToken();
    const token = await response.json().then(r => r.token);
    
    const { statusCode } = await userService.getUser(token, '123');
    expect(statusCode).toBe(StatusCodes.OK);
});
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Project overview and rules
- **[CONTEXT.md](./CONTEXT.md)** - Glossary of terms
- **[docs/](./docs/README.md)** - Documentation index
- **[.claude/skills/](./.claude/skills/README.md)** - How-to skills (creation, testing, workflows)
- **[docs/decisions/](./docs/decisions/)** - Architecture decisions (ADRs)
- **[docs/guidance/](./docs/guidance/)** - Framework guidance per pattern (expect, messages, notifications, sections, skeleton)
- **[docs/examples.md](./docs/examples.md)** - Quick-reference code examples
- **[docs/ci/](./docs/ci/)** - GitHub Actions and GitLab CI templates

## 🛠️ Available Scripts

```bash
npm run test:e2e          # Run E2E tests
npm run test:api          # Run API tests
npm run test:new          # Run tests tagged @new
npm run format            # Format code with Prettier
npm run lint              # Lint code with ESLint
npm run install:all       # Install all dependencies
```

## 🏗️ Creating New Components

### Page Object with Containers
```bash
# 1. Create containers
src/components/containers/my-page/
├── header.container.ts
├── main.container.ts
└── footer.container.ts

# 2. Create page object
src/pages/my-page.ts

# 3. Register in fixtures
src/fixtures/page-fixtures.ts
```

See [.claude/skills/create-page-object.md](./.claude/skills/create-page-object.md) for details.

### API Service
```typescript
// src/services/my-service.ts
import { BaseService } from '@services/base.service';

export class MyService extends BaseService {
    constructor() {
        super('/api/my-resource');
    }
    
    async getResource(token: string, id: string) {
        return await this.get({ token, id });
    }
}
```

See [.claude/skills/create-api-service.md](./.claude/skills/create-api-service.md) for details.

## 🐛 Troubleshooting

- **[Common Errors](./docs/troubleshooting/common-errors.md)**
- **[Debugging Tips](./docs/troubleshooting/debugging-tips.md)**
- **[FAQ](./docs/troubleshooting/faq.md)**

## 📋 Coding Standards

- **SOLID** - Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **YAGNI** - You Aren't Gonna Need It (don't over-engineer)
- **KISS** - Keep It Simple, Stupid (prefer simplicity)
- **DRY** - Don't Repeat Yourself (reuse code)

See [docs/decisions/ADR-004-yagni-kiss-dry-principles.md](./docs/decisions/ADR-004-yagni-kiss-dry-principles.md)

## 🤝 Contributing

1. Read [CLAUDE.md](./CLAUDE.md) and [CONTEXT.md](./CONTEXT.md)
2. Check [docs/decisions/](./docs/decisions/) for architectural patterns
3. Follow existing code style and patterns
4. Run tests and linting before committing
5. Update documentation if adding new patterns

## 📄 License

MIT
