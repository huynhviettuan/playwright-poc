# Designing API Testing That Developers Actually Want to Maintain

_How the Controller Pattern, typed responses, and Playwright fixtures turn API tests from fragile scripts into a
scalable test architecture._

---

## The Problem: API Tests That Rot

Most API test suites start as a collection of raw HTTP calls with hardcoded URLs, manual JSON parsing, and a `token`
variable passed everywhere. They work for 10 tests. By 100, they're unmaintainable:

```typescript
// The "just ship it" approach
const response = await request.post('https://api.example.com/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'John', email: 'john@test.com' }
});
const body = await response.json();
expect(response.status()).toBe(201);
expect(body.id).toBeDefined();
```

What's wrong here?

-   **The URL is hardcoded.** Change the domain? Find-and-replace across 200 files.
-   **The token is passed per-call.** Forget it once and you get a cryptic 401 in CI.
-   **The response is untyped.** `body.id` could be a string, number, or undefined — TypeScript can't help you.
-   **There's no structure.** User endpoints, auth endpoints, and order endpoints all live in the same flat file.

This isn't a testing problem. It's a **design** problem. And the solution already exists in backend development.

---

## The Insight: Your API Already Has an Architecture — Mirror It

Every well-designed REST API is organized around **controllers** (or **resources**):

```
UsersController       → GET/POST/PUT/DELETE /users
TokensController      → GET/POST/DELETE /tokens
AuthController        → POST /auth/signin, POST /auth/logout
```

Each controller owns one resource. Methods map 1:1 to endpoints. Request and response types are defined as DTOs,
separate from the controller logic.

**Your test services should follow the same structure.** Not because it's theoretically elegant, but because it makes
Swagger-to-test-code conversion mechanical, changes predictable, and onboarding trivial.

---

## Layer 1: BaseService — The HTTP Foundation

Every API test framework needs an HTTP client layer. The temptation is to use `request.get()` / `request.post()`
directly in tests. Resist it.

`BaseService` handles the mechanics so services can focus on _what_ to call, not _how_:

```typescript
export class BaseService {
    protected readonly basePath: string;
    private _token?: string;

    constructor(basePath: string = '') {
        this.basePath = basePath;
    }

    setToken(token: string): this {
        this._token = token;
        return this;
    }

    protected endpoint(subPath: string = ''): string {
        return `${API_DOMAIN}${this.basePath}${subPath}`;
    }

    protected async send<T>(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        args: RequestArgs = {}
    ): Promise<ServiceResponse<T>> {
        const url = this.createUrl(args);
        const options = this.buildRequestOptions(args);
        const { statusCode, response } = await this.sendRequest(method, url, options);
        const text = await response.text();
        const data = text ? (JSON.parse(text) as T) : (undefined as T);
        return { statusCode, data, response };
    }
}
```

### What this gives you

| Concern              | How BaseService handles it                                               |
| -------------------- | ------------------------------------------------------------------------ |
| **URL construction** | `endpoint('/signin')` → `API_DOMAIN + basePath + '/signin'`              |
| **Token management** | `setToken()` once — injected into every subsequent request               |
| **Header merging**   | Default headers, custom headers, and auth header composed automatically  |
| **Typed responses**  | `send<T>()` returns `ServiceResponse<T>` — no manual `response.json()`   |
| **Debug logging**    | `DEBUG_API=true` prints method, URL, headers, body, status, and duration |
| **Timeout defaults** | Configurable per-request, with a sensible global default                 |

The key design decision: **`send<T>()` returns `ServiceResponse<T>`**, not a raw response:

```typescript
type ServiceResponse<T> = {
    statusCode: number; // HTTP status code
    data: T; // Parsed and typed response body
    response: APIResponse; // Raw response for edge cases (headers, etc.)
};
```

Tests destructure what they need. TypeScript enforces the response shape. No more
`(await response.json()).data.items[0].id` chains.

---

## Layer 2: Service Classes — One Per Controller

Each service class maps to **one Swagger tag / one backend controller**. Each method maps to **one endpoint**:

```typescript
export class TokensService extends BaseService {
    constructor() {
        super('/tokens');
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

### The conversion is mechanical

Open the Swagger spec. Find the tag. Write the service:

```
Swagger tag: "Tokens"          →  TokensService
  GET    /tokens               →  tokensService.getAll()
  POST   /tokens               →  tokensService.create(body)
  DELETE /tokens/{id}          →  tokensService.deleteById(id)
```

New endpoint added to the API? Add one method to one file. No hunting through a shared helper. No merge conflicts with
teammates working on different resources.

### Non-CRUD endpoints get domain-specific names

Not everything is CRUD. Auth endpoints, batch operations, and domain actions deserve descriptive names:

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

    async forgetPassword(body: ForgetPasswordRequest): Promise<ServiceResponse<void>> {
        return await this.send<void>('post', {
            url: this.endpoint('/forget-password'),
            body
        });
    }

    async resetPassword(body: ResetPasswordRequest): Promise<ServiceResponse<void>> {
        return await this.send<void>('post', {
            url: this.endpoint('/reset-password'),
            body
        });
    }
}
```

### Method naming conventions

| HTTP Verb               | Method Name        | Signature                                    |
| ----------------------- | ------------------ | -------------------------------------------- |
| `GET /resource`         | `getAll()`         | `(params?) → ServiceResponse<T[]>`           |
| `GET /resource/{id}`    | `getById(id)`      | `(id: string) → ServiceResponse<T>`          |
| `POST /resource`        | `create(body)`     | `(body: CreateRequest) → ServiceResponse<T>` |
| `PUT /resource/{id}`    | `update(id, body)` | `(id, body) → ServiceResponse<T>`            |
| `PATCH /resource/{id}`  | `patch(id, body)`  | `(id, body) → ServiceResponse<T>`            |
| `DELETE /resource/{id}` | `deleteById(id)`   | `(id: string) → ServiceResponse<void>`       |
| Non-CRUD                | Domain name        | `signIn()`, `resetPassword()`, `export()`    |

Consistency here means you can guess the method name before looking at the code.

---

## Layer 3: Types — Models Live Separately

Request and response types belong under `src/models/`, not beside the service class. This mirrors backend DTO
separation:

```typescript
// src/models/auth/user-organization.interface.ts
export type SignInRequest = {
    email: string;
    password: string;
};

export type SignInResponse = {
    token: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
};
```

```typescript
// src/models/tokens/tokens.interface.ts
export type Token = {
    id: string;
    name: string;
    createdAt: string;
};

export type CreateTokenRequest = {
    name: string;
};
```

Why separate? Because consumers beyond tests need these types — factories, commands, fixtures, and other services.
Co-locating types with the service forces unnecessary imports.

---

## Layer 4: Fixtures — Dependency Injection for Tests

Services are registered as Playwright fixtures, so tests declare what they need and receive fresh instances:

```typescript
// src/fixtures/service-fixtures.ts
export const test = base.extend<Services>({
    tokensService: async ({}, use) => {
        await use(new TokensService());
    },
    userOrganizationService: async ({}, use) => {
        await use(new UserOrganizationService());
    }
});
```

Tests never construct services directly. This is Dependency Inversion — the same principle that NestJS, Spring, and
every modern backend framework uses:

```typescript
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER: import { test } from '@playwright/test';
```

---

## Putting It All Together: Real Tests

### Simple auth test — no setup needed

```typescript
test.describe('API — POST /user-organization/auth/signin', () => {
    test('valid credentials return token', async ({ userOrganizationService }) => {
        const { statusCode, data } = await userOrganizationService.signIn({
            email: Config.auth.superAdminEmail,
            password: Config.auth.password
        });

        expect(statusCode).toEqual(StatusCodes.OK);
        expect(data.token).toBeTruthy();
    });

    test('wrong password returns 401', async ({ userOrganizationService }) => {
        const { statusCode, data } = await userOrganizationService.signIn({
            email: Config.auth.superAdminEmail,
            password: 'WrongPassword!'
        });

        expect(statusCode).toEqual(StatusCodes.UNAUTHORIZED);
        expect((data as Partial<SignInResponse>)?.token).toBeFalsy();
    });

    test('missing email returns 400', async ({ userOrganizationService }) => {
        const { statusCode } = await userOrganizationService.signIn({
            password: Config.auth.password
        } as unknown as SignInRequest);

        expect(statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
});
```

Notice what's **not** here: no URL strings, no manual headers, no JSON parsing, no token management. The test reads like
a specification.

### CRUD with setup and cleanup

```typescript
test.describe('Tokens Service', () => {
    let authorizationToken: string;

    test.beforeAll(async ({ apiCommands }) => {
        authorizationToken = await apiCommands.getAuthorizationToken(SUPER_ADMIN_EMAIL);
    });

    test('GET /tokens', async ({ tokensService }) => {
        tokensService.setToken(authorizationToken);

        await tokensService.create({ name: DataGenerator.randomString() });
        const { statusCode, data } = await tokensService.getAll();

        expect(statusCode).toEqual(StatusCodes.OK);
        await validateJsonSchema('GET_tokens', schemaFolder, data);
    });

    test('DELETE /tokens/{id}', async ({ tokensService }) => {
        tokensService.setToken(authorizationToken);

        await tokensService.create({ name: DataGenerator.randomString() });
        const { data: tokens } = await tokensService.getAll();
        const { statusCode } = await tokensService.deleteById(tokens[0].id);

        expect(statusCode).toEqual(StatusCodes.NO_CONTENT);
    });

    test.afterEach(async ({ tokensService }) => {
        tokensService.setToken(authorizationToken);
        const { data: tokens } = await tokensService.getAll();
        await ArrayHelper.forEachSync(tokens, async ({ id }) => {
            await tokensService.deleteById(id);
        });
    });
});
```

The pattern is consistent: **set token → call service method → assert status and data → clean up**.

---

## Design Decisions Worth Stealing

### 1. Token set once, not per method

```typescript
// ✅ Set once — used by all subsequent calls
tokensService.setToken(authorizationToken);
const { data } = await tokensService.getAll();
const { statusCode } = await tokensService.deleteById(data[0].id);

// ❌ Don't pass token to every call
await tokensService.getAll(authorizationToken);
await tokensService.deleteById(authorizationToken, id);
```

The service holds auth state. Tests that need different auth levels create separate service instances via fixtures.

### 2. StatusCodes enum over magic numbers

```typescript
// ✅ Self-documenting
expect(statusCode).toEqual(StatusCodes.UNAUTHORIZED);

// ❌ What does 401 mean without context?
expect(statusCode).toBe(401);
```

### 3. Schema validation alongside assertions

```typescript
const { statusCode, data } = await tokensService.getAll();
expect(statusCode).toEqual(StatusCodes.OK);
await validateJsonSchema('GET_tokens', 'tokens', data);
```

Business assertions check _values_. Schema validation checks _structure_. Both can fail independently, and both should.

### 4. Random test data, not hardcoded values

```typescript
// ✅ Isolated — never collides with other test runs
const name = DataGenerator.randomString();
const email = DataGenerator.randomEmail('api-test');

// ❌ Shared state — breaks in parallel, breaks in CI
const name = 'Test Token';
const email = 'test@example.com';
```

### 5. `as unknown as T` for negative tests

```typescript
// Testing missing required fields — intentionally invalid
const { statusCode } = await userOrganizationService.signIn({
    password: Config.auth.password
} as unknown as SignInRequest);

expect(statusCode).toEqual(StatusCodes.BAD_REQUEST);
```

TypeScript rightfully complains when you omit required fields. `as unknown as T` signals intent: _"I know this is
invalid — that's the point."_

---

## The Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                        Tests                            │
│  test('...', async ({ tokensService }) => {             │
│      tokensService.setToken(token);                     │
│      const { statusCode, data } = await ...             │
│  });                                                    │
├─────────────────────────────────────────────────────────┤
│                      Fixtures                           │
│  Dependency injection — tests declare, fixtures provide │
├──────────────────────┬──────────────────────────────────┤
│    Service Classes   │         Type Definitions         │
│  TokensService       │  Token, CreateTokenRequest       │
│  UserOrgService      │  SignInRequest, SignInResponse    │
│  (one per controller)│  (in src/models/, not beside     │
│                      │   the service)                   │
├──────────────────────┴──────────────────────────────────┤
│                     BaseService                         │
│  URL construction, token management, typed send<T>(),   │
│  header merging, debug logging, timeout defaults        │
├─────────────────────────────────────────────────────────┤
│              Playwright APIRequestContext               │
│  The actual HTTP layer — we never touch it directly     │
└─────────────────────────────────────────────────────────┘
```

---

## Common Objections

**"This is over-engineered for a small API."**

If your API has 3 endpoints, a flat helper file is fine. This architecture pays off when you cross ~15 endpoints or ~2
developers. The inflection point is when someone asks "where does the test for X live?" and the answer isn't obvious.

**"Why not use an HTTP client library directly?"**

You could. But you'd lose typed responses, automatic token injection, and the ability to swap the underlying HTTP layer
(Playwright today, `fetch` tomorrow) without rewriting every test.

**"Why Playwright for API tests? Why not Jest + Axios?"**

Because most teams need both E2E and API tests. Playwright's `APIRequestContext` shares the same fixture system,
configuration, and reporting as UI tests. One framework, one `test` import, one CI pipeline.

---

## Checklist: Designing Your API Test Layer

1. **Create `BaseService`** with `send<T>()`, token management, and URL construction
2. **One service per Swagger tag** — name it `{Resource}Service`
3. **Types in `src/models/`** — separate from service implementation
4. **Method names follow CRUD conventions** — `getAll`, `getById`, `create`, `update`, `deleteById`
5. **Register services as fixtures** — tests declare dependencies, never construct them
6. **Use `StatusCodes` enum** — no magic numbers
7. **Random test data** — `DataGenerator` for isolation
8. **Schema validation** — `validateJsonSchema()` alongside business assertions
9. **Cleanup in `afterEach`** — leave the API state clean for the next test
10. **Import from `@fixtures/fixtures`** — never from `@playwright/test`

---

## Conclusion

API test design isn't about choosing the right assertion library or HTTP client. It's about **mirroring the architecture
of the system you're testing**.

When your API is organized by controllers, your test services should be too. When your backend uses typed DTOs, your
test types should match. When your framework supports dependency injection, your tests should use it.

The result is an API test suite where:

-   Adding a new endpoint means adding one method to one service
-   Every test reads like a specification: arrange, act, assert
-   Type safety catches shape mismatches before CI does
-   Tests run in parallel without colliding on shared state

Your API has an architecture. Design your tests to match it.

---

_This article is part of a series on test automation architecture. See also:
[Stop Writing Monolithic Page Objects](medium-component-controller-architecture.md) for the UI side of the same
framework._
