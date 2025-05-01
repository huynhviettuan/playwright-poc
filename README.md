# Project Path Aliases

This project uses TypeScript path aliases to simplify and standardize import paths across the codebase. These aliases
are defined in the `tsconfig.json` file and help avoid long relative import paths like `../../../components/Button`.

## Path Aliases Overview

| Alias           | Maps To            | Description                                                                 |
| --------------- | ------------------ | --------------------------------------------------------------------------- |
| `@pages/*`      | `src/pages/*`      | Page-level components, typically route views or screens.                    |
| `@models/*`     | `src/models/*`     | Data models, TypeScript interfaces, and types.                              |
| `@elements/*`   | `src/elements/*`   | Reusable UI elements (e.g., Button, Input, etc.) that are atomic in nature. |
| `@components/*` | `src/components/*` | Composite UI components built from elements, possibly stateful.             |
| `@constants/*`  | `src/constants/*`  | Static values such as config values, routes, status codes, etc.             |
| `@enums/*`      | `src/enums/*`      | Enumerations used throughout the application.                               |
| `@services/*`   | `src/services/*`   | API calls, service handlers, or business logic modules.                     |
| `@fixtures/*`   | `src/fixtures/*`   | Sample/mock data for testing or local development.                          |
| `@helpers/*`    | `src/helpers/*`    | Utility functions or pure logic helpers.                                    |
| `@mail/*`       | `src/mail/*`       | Mail templates, handlers, or email service utilities.                       |
| `@data/*`       | `src/data/*`       | Static data, JSON files, or datasets used in the app.                       |
| `@common/*`     | `src/common/*`     | Shared utilities, base components, or cross-cutting modules.                |

## How to Use

Instead of:

```ts
import Button from '../../../components/ui/Button';
```

Use:

```ts
import Button from '@components/ui/Button';
```

## Configuration

These aliases are set up in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@pages/*": ["src/pages/*"],
            "@models/*": ["src/models/*"],
            "@elements/*": ["src/elements/*"],
            "@components/*": ["src/components/*"],
            "@constants/*": ["src/constants/*"],
            "@enums/*": ["src/enums/*"],
            "@services/*": ["src/services/*"],
            "@fixtures/*": ["src/fixtures/*"],
            "@helpers/*": ["src/helpers/*"],
            "@mail/*": ["src/mail/*"],
            "@data/*": ["src/data/*"],
            "@common/*": ["src/common/*"]
        }
    }
}
```

Make sure your build tools (e.g., Webpack, Vite, or Jest) are also configured to recognize these paths.

## Benefits

-   Cleaner and more maintainable imports.
-   Easier refactoring.
-   Improved readability and organization.

---

## 🧪 Test Fixtures Structure

This project leverages [Playwright test fixtures](https://playwright.dev/docs/test-fixtures) to modularize and manage
reusable test utilities such as services, page objects, mail handling, and custom commands.

All fixtures are centralized and merged in a single entry point for consistency and reusability.

### `src/fixtures/index.ts`

```ts
import { test as hookFixtures } from '@fixtures/hook-fixtures';
import { mergeExpects, mergeTests } from '@playwright/test';
import { test as commandFixtures } from 'src/fixtures/command-fixtures';
import { expect as expectFixtures } from 'src/fixtures/expect-fixtures';
import { test as mailFixtures } from 'src/fixtures/mail-fixtures';
import { test as pageFixtures } from 'src/fixtures/page-fixtures';
import { test as serviceFixtures } from 'src/fixtures/service-fixtures';

export const test = mergeTests(serviceFixtures, commandFixtures, mailFixtures, pageFixtures, hookFixtures);
export const expect = mergeExpects(expectFixtures);
```

### 🔍 Explanation

-   **Modular Fixtures**: Each file (e.g., `page-fixtures.ts`, `service-fixtures.ts`) defines related fixtures in
    isolation.
-   **Alias Usage**: Fixtures are imported using the `@fixtures/*` alias for consistency and shorter paths.
-   **`mergeTests()`**: Combines all test fixtures into a single `test` object to be used in your Playwright test files.
-   **`mergeExpects()`**: Combines custom `expect` matchers (like soft assertions, extensions) with Playwright’s default
    `expect`.

### ✅ Usage in Tests

Instead of importing individual fixtures:

```ts
import { test, expect } from 'src/fixtures/index';
```

Use the centralized version:

```ts
import { test, expect } from '@fixtures';
```

### 📂 Recommended Fixture Structure

```
src/
├── fixtures/
│   ├── index.ts               # Merges and exports all fixtures
│   ├── page-fixtures.ts       # Page object fixtures
│   ├── command-fixtures.ts    # Custom test commands
│   ├── service-fixtures.ts    # Service/API-related fixtures
│   ├── mail-fixtures.ts       # Email-related fixtures
│   ├── hook-fixtures.ts       # Lifecycle hooks (beforeEach, afterEach)
│   ├── expect-fixtures.ts     # Custom matchers
```

---

## 📄 Page Object Example

Here’s an example of how a page object (SignInPage) is implemented using path aliases:

```ts
import { $ } from '@common/element.function';
import { PASSWORD } from '@constants/config.constant';
import { Button } from '@elements/common/button';
import { FieldError } from '@elements/common/field-error';
import { Label } from '@elements/common/label';
import { Notification } from '@elements/common/notification';
import { TextBox } from '@elements/common/textbox';
import { Locator } from 'playwright-core';

export class SignInPage {
    cpnSignInForm: Locator;
    lblSignInTitle: Label;
    txtEmailAddress: TextBox;
    txtPassword: TextBox;
    btnLogin: Button;
    fieldError: FieldError;
    notification: Notification;

    constructor() {
        this.cpnSignInForm = $('div.sign-in form');
        this.lblSignInTitle = new Label($('h2.sign-in__title'));
        this.txtEmailAddress = new TextBox({
            parentLocator: this.cpnSignInForm,
            label: 'Email address'
        });
        this.txtPassword = new TextBox({
            parentLocator: this.cpnSignInForm,
            label: 'Password'
        });
        this.btnLogin = new Button({
            parentLocator: this.cpnSignInForm,
            label: 'Log in'
        });
        this.fieldError = new FieldError();
        this.notification = new Notification();
    }

    async signIn(email: string, password = PASSWORD): Promise<void> {
        await this.txtEmailAddress.fill(email);
        await this.txtPassword.fill(password);
        await this.btnLogin.click();
    }
}
```

### 🔑 Highlights

-   This pattern promotes **encapsulation** of page interactions.
-   The `@elements` and `@common` aliases provide a clean way to reference reusable UI logic.
-   Ensures a consistent and scalable test architecture.

---

## 📗 Registering Page Object Fixtures

Here's how to register the `SignInPage` as a fixture using `page-fixtures.ts`:

```ts
import { SignInPage } from '@pages/sign-in';
import { test as base } from '@playwright/test';

type PageObjects = {
    signInPage: SignInPage;
};

export const test = base.extend<PageObjects>({
    signInPage: async ({}, use) => {
        await use(new SignInPage());
    }
});
```

This makes `signInPage` available in your tests:

```ts
import { test } from '@fixtures';

test('user can sign in', async ({ signInPage }) => {
    await signInPage.signIn('test@example.com');
});
```
