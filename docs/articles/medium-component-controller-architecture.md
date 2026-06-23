# Stop Writing Monolithic Page Objects: How Frontend Component Architecture and Backend Controller Patterns Will Save Your Test Framework

_A practical guide to building Playwright test automation that scales with your application._

---

## The Problem Nobody Talks About

Every test automation framework starts the same way: a few page objects, a couple of helper methods, and tests that
pass. Six months later, your `LoginPage` is 400 lines long, your `DashboardPage` is 800, and nobody wants to touch
either of them.

Sound familiar?

The root cause isn't that testers write bad code. It's that **test frameworks are designed in isolation from the
applications they test**. Frontend teams decompose UIs into components. Backend teams organize APIs around controllers.
But test automation? We're still cramming everything into flat Page Objects that would make a 2010 Selenium tutorial
proud.

What if we borrowed the patterns that already work on both sides of the stack?

This article walks through a Playwright-based framework that mirrors **frontend component architecture** for UI
interactions and **backend controller patterns** for API services — and explains _why_ this isn't just architectural
astronautics, but the difference between a framework that scales and one that collapses under its own weight.

---

## Part 1: The Frontend Lesson — Components, Not Monoliths

### What Frontend Developers Already Know

Modern frontend frameworks (React, Vue, Angular) decompose pages into a tree of components. A login page isn't one blob
of HTML — it's a composition:

```
LoginPage
├── HeaderComponent       (logo, title)
├── LoginFormComponent    (email, password, submit button)
└── FooterComponent       (links, copyright)
```

Each component:

-   **Owns its own markup and behavior**
-   **Can be tested independently**
-   **Can be reused across pages**

This is the Single Responsibility Principle applied to UI. It works because **changes to the header never break the
form**, and vice versa.

### Why Page Objects Should Work the Same Way

Traditional Page Object Model puts everything flat:

```typescript
// The classic approach — everything in one class
class LoginPage {
    readonly logo = page.locator('.logo');
    readonly title = page.locator('h1');
    readonly emailInput = page.locator('#email');
    readonly passwordInput = page.locator('#password');
    readonly submitButton = page.locator('#submit');
    readonly forgotPasswordLink = page.locator('.forgot-pwd');
    readonly termsLink = page.locator('.terms');
    readonly privacyLink = page.locator('.privacy');
    readonly copyrightLabel = page.locator('.copyright');

    async login(email: string, password: string) {
        /* ... */
    }
    async goToForgotPassword() {
        /* ... */
    }
    async getTitle(): Promise<string> {
        /* ... */
    }
}
```

This seems fine for a login page with 9 elements. Now imagine a dashboard with 50+ elements across multiple sections,
tables, filters, modals, and drawers. The class explodes. Worse:

-   **One testid appears in multiple DOM locations** (a modal reuses the same component as the main page). Which
    `.locator('#save-btn')` are you clicking?
-   **A header redesign forces you to edit the page object**, even though only the header changed.
-   **Two pages share the same footer** but you've duplicated the footer elements in both page objects.

### Container-Based Architecture: Mirror the Frontend

Instead of one class per page, we **compose page objects from container classes** — one per visual section:

```
src/components/containers/sign-in/
├── header.container.ts
├── main.container.ts
└── footer.container.ts

src/pages/sign-in/
└── index.ts              ← composes the three containers
```

Each container scopes its elements to a parent locator:

```typescript
export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;

    readonly txtEmail: Input;
    readonly txtPassword: Input;
    readonly btnLogin: Button;

    constructor() {
        this.container = $('.sign-in-main');
        this.form = new Form(this.container);

        this.txtEmail = this.form.getInput({ label: 'Email address' });
        this.txtPassword = this.form.getInput({ label: 'Password' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });
    }

    async fillCredentials(email: string, password: string): Promise<void> {
        await this.txtEmail.fill(email);
        await this.txtPassword.fill(password);
    }
}
```

The page object becomes a thin composition layer:

```typescript
export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;

    constructor() {
        this.header = new SignInHeaderContainer();
        this.main = new SignInMainContainer();
        this.footer = new SignInFooterContainer();
    }

    async signIn(email: string, password: string): Promise<void> {
        await this.main.fillCredentials(email, password);
        await this.main.btnLogin.click();
    }
}
```

### Why This Matters at Scale

**1. Parent scoping eliminates flakiness.**

Every element resolves through its container's `Locator`. If `data-testid="save-btn"` appears in both a modal and the
main page, each container's elements are scoped correctly. No more "clicked the wrong button" failures at 2 AM.

**2. Changes are isolated.**

A header redesign touches `header.container.ts`. The main container, footer, and page object don't change. This is the
Open/Closed Principle: extend behavior without modifying existing code.

**3. Containers are reusable.**

If three pages share the same navigation header, they share the same `NavHeaderContainer`. Define it once; compose it in
each page object.

**4. Tests read like user stories.**

```typescript
test('should sign in successfully', async ({ signInPage }) => {
    await signInPage.signIn('user@example.com', 'password123');
    await expect(signInPage.header.lblTitle).toHaveText('Dashboard');
});
```

The test doesn't know (or care) about locators, CSS selectors, or DOM structure. It talks to containers.

### The Element Hierarchy: Composition Over Inheritance

Below the containers, elements follow a focused class hierarchy:

```
BaseControl          → visibility, text, attributes (pure read)
├── Clickable        → click, double-click, hover (interaction)
├── Editable         → fill, clear, type, drag-and-drop (input)
└── Specialized      → Button, Input, Dropdown, DatePicker, etc.
```

Each level adds **one category of behavior**. A `Button` is a `Clickable`. An `Input` is an `Editable`. A `Label` is
just a `BaseControl`. There's no god class that knows how to click, type, select from a dropdown, and pick a date all at
once.

This mirrors how frontend component libraries work: a `<Button>` doesn't inherit from `<Input>`. They're siblings that
share a common base.

### Dynamic Sections: Factory Methods, Not Singletons

When a page has repeating sections (e.g. a profile page with "Personal Info" and "Billing Address" panels), we use a
factory:

```typescript
export class ProfileMainContainer {
    private readonly container: Locator;

    constructor() {
        this.container = $('.profile-main');
    }

    getSection(name: string): FormSectionContainer {
        const section = this.container.locator('section', {
            hasText: name
        });
        return new FormSectionContainer(section);
    }
}
```

Each call returns a **new instance scoped to that section's DOM**. No shared state. No "which section am I looking at?"
bugs. The page object hides the complexity:

```typescript
await profilePage.updatePersonalInfo({ firstName: 'John', lastName: 'Doe' });
await profilePage.updateBillingAddress({ address: '123 Main St', city: 'NYC' });
```

---

## Part 2: The Backend Lesson — Controllers, Not Utility Classes

### What Backend Developers Already Know

REST APIs are organized by resource. Each controller handles one resource (or one bounded context):

```
UsersController       → GET/POST/PUT/DELETE /users
OrdersController      → GET/POST/PUT/DELETE /orders
AuthController        → POST /auth/signin, POST /auth/logout
```

Each controller has one responsibility: manage its resource's lifecycle. Methods map 1:1 to endpoints.

### Why API Test Services Should Work the Same Way

The common anti-pattern in test automation is the "ApiHelper" god class:

```typescript
// Don't do this
class ApiHelper {
    async createUser(data) {
        /* POST /users */
    }
    async getUsers() {
        /* GET /users */
    }
    async login(email, password) {
        /* POST /auth/signin */
    }
    async createOrder(data) {
        /* POST /orders */
    }
    async getTokens() {
        /* GET /tokens */
    }
    async deleteToken(id) {
        /* DELETE /tokens/{id} */
    }
    // ... 50 more methods covering every endpoint
}
```

This violates every principle we just discussed. It's the backend equivalent of a monolithic page object.

### The Controller Pattern: One Service Per Resource

Each service class maps to **one backend controller / Swagger tag**:

```typescript
export class TokensService extends BaseService {
    constructor() {
        super('/tokens'); // base path, just like a controller route prefix
    }

    async getAll(): Promise<ServiceResponse<Token[]>> {
        return await this.send<Token[]>('get');
    }

    async create(body: CreateTokenRequest): Promise<ServiceResponse<Token>> {
        return await this.send<Token>('post', { body });
    }

    async deleteById(id: string): Promise<ServiceResponse<void>> {
        return await this.send<void>('delete', { id });
    }
}
```

```typescript
export class UserOrganizationService extends BaseService {
    constructor() {
        super('/user-organization/auth');
    }

    async signIn(body: SignInRequest): Promise<ServiceResponse<SignInResponse>> {
        return await this.send<SignInResponse>('post', {
            url: this.endpoint('/signin'),
            body
        });
    }

    async logout(): Promise<ServiceResponse<void>> {
        return await this.send<void>('post', {
            url: this.endpoint('/logout')
        });
    }
}
```

### The BaseService: Your Backend's HttpClient

Just as frontend apps have an HTTP client layer (Axios, fetch wrapper), `BaseService` handles:

-   **URL construction** — `endpoint('/signin')` → `API_DOMAIN + basePath + '/signin'`
-   **Token management** — `setToken()` once, used by all subsequent calls
-   **Typed responses** — `send<T>()` returns `ServiceResponse<T>` with parsed `data`, `statusCode`, and raw `response`
-   **Debug logging** — toggled via `DEBUG_API=true`

Services don't know about HTTP details. They declare _what_ to call and _what type_ to expect. The base class handles
_how_.

### Why This Matters

**1. Swagger-to-code conversion becomes mechanical.**

```
Swagger tag: "Tokens"          →  TokensService
  GET    /tokens               →  tokensService.getAll()
  POST   /tokens               →  tokensService.create(body)
  DELETE /tokens/{id}          →  tokensService.deleteById(id)
```

New API endpoint? Add one method to one file. No hunting through a 500-line helper.

**2. Type safety flows from models to tests.**

Request and response types live in `src/models/`, separate from services — just like backend DTOs live separate from
controllers. Tests get full IntelliSense:

```typescript
const { statusCode, data } = await tokensService.create({
    name: 'My Token', // TypeScript knows the shape
    expiresAt: tomorrow // Autocomplete works
});
expect(data.id).toBeDefined(); // data is typed as Token
```

**3. Services compose through fixtures, not globals.**

```typescript
// Fixtures register services — tests receive them via dependency injection
export const test = base.extend<Services>({
    tokensService: async ({}, use) => {
        await use(new TokensService());
    }
});

// Tests declare what they need
test('should create token', async ({ tokensService }) => {
    tokensService.setToken(authToken);
    const { statusCode } = await tokensService.create({ name: 'test' });
    expect(statusCode).toEqual(201);
});
```

This is the same Dependency Inversion principle that backend frameworks (NestJS, Spring) use: the test doesn't construct
its dependencies, it receives them.

---

## Part 3: Where the Two Patterns Meet

The power isn't in either pattern alone — it's in how they reinforce each other.

### Shared Principles

| Principle                        | Frontend (Containers)                   | Backend (Services)                         |
| -------------------------------- | --------------------------------------- | ------------------------------------------ |
| **Single Responsibility**        | One container per UI section            | One service per API resource               |
| **Open/Closed**                  | Add containers without modifying pages  | Add methods without modifying base service |
| **Dependency Inversion**         | Tests receive page objects via fixtures | Tests receive services via fixtures        |
| **Composition over Inheritance** | Pages compose containers                | Services compose through BaseService       |
| **Scoped by boundary**           | Containers scoped to parent DOM node    | Services scoped to base path               |

### The Fixture System: Unifying Both Worlds

Both page objects and services are registered as Playwright fixtures and merged into a single `test` import:

```typescript
import { expect, test } from '@fixtures/fixtures';

test('full user journey', async ({ signInPage, tokensService, notification }) => {
    // UI: sign in
    await signInPage.signIn('admin@example.com');
    await expect(notification.toast).toHaveText('Welcome back');

    // API: create a token
    tokensService.setToken(sessionToken);
    const { data } = await tokensService.create({ name: 'api-key' });
    expect(data.id).toBeDefined();
});
```

One import. UI and API interactions in the same test. Type-safe throughout. No global state. No utility classes. No
monoliths.

### The File Structure Tells the Story

```
src/
├── pages/               ← Page Objects (thin composition)
│   └── sign-in/
│       └── index.ts
├── components/          ← Containers + Reusable UI components
│   ├── containers/
│   │   └── sign-in/
│   │       ├── header.container.ts
│   │       ├── main.container.ts
│   │       └── footer.container.ts
│   ├── form.component.ts
│   └── table.component.ts
├── elements/            ← Element hierarchy (BaseControl → Clickable → Button)
│   ├── base/
│   └── common/
├── services/            ← API services (one per controller)
│   ├── base.service.ts
│   ├── tokens.service.ts
│   └── user-organization.service.ts
├── models/              ← Types (DTOs), separate from implementation
├── fixtures/            ← Dependency injection registry
└── helpers/             ← Pure utility functions
```

Anyone who has worked on a modern web application recognizes this structure. That's the point.

---

## Part 4: The Pragmatic Rules

Architecture without discipline drifts. Here are the non-negotiable rules that keep the framework honest.

### For UI (Container Side)

1. **Every element must resolve through a parent Locator.** No `page.locator()` calls. Same testid can appear in modals,
   hidden tabs, and prerendered routes.

2. **Use the `Form` component for form elements.** `new Form(container)` + `form.getInput({ label })` — never wire
   inputs page-globally.

3. **Containers are not singletons.** Each instance gets its own scoped Locator. Shared state between sections causes
   flaky tests.

4. **Page objects expose business methods, not elements.** Tests call `signInPage.signIn()`, not
   `signInPage.main.txtEmail.fill()`.

### For API (Service Side)

5. **One service class per Swagger tag / backend controller.** No god classes.

6. **Types live in `@models/`, not beside the service.** Consumers import types without pulling in service
   implementations.

7. **Token set once, not per method.** `service.setToken(token)` in setup; methods don't accept token parameters.

8. **Method names follow CRUD conventions.** `getAll()`, `getById()`, `create()`, `update()`, `deleteById()`. Non-CRUD
   gets domain names: `signIn()`, `resetPassword()`.

### For Both

9. **Import `test` and `expect` from `@fixtures/fixtures`, never from `@playwright/test`.** Custom fixtures and expect
   matchers only work through the merged import.

10. **YAGNI over future-proofing.** Don't add pagination support to a service until a test needs it. Don't create a
    footer container if no test asserts on footer content.

---

## Conclusion: Your Test Framework Is Software Too

The test automation industry has a blind spot: we treat test code as second-class. We wouldn't accept a frontend
codebase where every page is one 800-line component, or a backend where every endpoint lives in a single controller. Yet
we build test frameworks exactly that way.

The fix isn't complicated. It's borrowed:

-   **From frontend:** decompose pages into scoped, composable containers that mirror the UI's component tree.
-   **From backend:** organize API services by resource, with typed requests/responses and a clean base class.
-   **From both:** use dependency injection (Playwright fixtures) to wire it all together without global state.

The result is a framework where:

-   Adding a new page means creating 3-4 small files, not editing a monolith
-   Adding a new API endpoint means adding one method to one service
-   Tests read like specifications, not DOM manipulation scripts
-   Changes to one section can't break another

Your application is built on modern architecture. Your test framework should be too.

---

_The patterns described in this article are implemented in [playwright-poc](https://github.com/user/playwright-poc), an
open-source Playwright test automation framework. Check the `.claude/skills/` directory for step-by-step guides on
building each component._
