# Skill: Explore Screens

## When to Use

Use this skill when you need to **inspect a live screen** and produce two things from a
single observation pass:

1. **UI artifacts** — locators that feed [`create-page-object`](create-page-object.md)
2. **API artifacts** — endpoints, request/response shapes that feed
   [`create-api-service`](create-api-service.md) and
   [`write-api-test`](write-api-test.md)

Doing both at once is the efficient path: the user actions you run to find the
"Log in" button (Step 2-4) are the same actions that trigger the `POST
/user-organization/auth/signin` call (Step 3, 5). One exploration session yields a
complete page object **and** the matching API service, with the response shapes
already captured for schema validation and mocking.

Typical triggers:

-   "Explore the Sign In screen and generate the page object + API spec"
-   "Open the Users page and capture both the UI locators and the API calls"
-   "Inspect this flow end-to-end — UI and network"

## Workflow Overview

```
1. Launch / connect to the screen                  → browser exploration tool
2. Capture DOM snapshot + locators        (UI)     → record candidate selectors
3. Trigger user flows + capture network   (API)    → record method/URL/body/response
4. Map DOM → element classes              (UI)     → Input/Button/Link/...
5. Map network → API service              (API)    → BaseService methods, models
6. Group UI by section + API by resource           → Header/Main/Footer + service classes
7. Hand off in parallel:
     - UI inventory → create-page-object
     - API inventory → create-api-service → write-api-test
8. Verify both                                     → locators resolve + API spec runs
```

## Step 1: Launch / Connect to the Screen

Pick **one** exploration method based on what is available:

### Option A — Claude in Chrome (preferred when available)

Use the connected browser MCP tools to drive a real browser session **with network
capture enabled**:

1. `navigate` to the target URL (use `Config.app.baseUrl` + the route, e.g. `Endpoints.auth.signIn`).
2. `read_page` / `get_page_text` to capture the accessibility tree and visible text.
3. `find` to locate specific controls by role/name when you need exact selectors.
4. **`read_network_requests`** — call this after each meaningful interaction to capture
   the requests that just fired. Filter by `urlPattern: '/api/'` (or the project's API
   prefix) to drop noise from static assets / analytics.
5. **`read_network_requests({ requestId: ... })`** — fetch a specific response body for
   inspection / saving as a fixture.
6. `read_console_messages` only if the screen depends on async rendering.

### Option B — Playwright codegen / inspector

When no live browser MCP is connected, drive Playwright directly. The inspector
has a Network tab that captures requests as you click. Or write a throwaway
exploration script in the scratchpad:

```ts
// scratchpad only — never commit this
import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
const apiCalls: Array<{ method: string; url: string; status?: number; body?: unknown }> = [];

page.on('request', (req) => {
    if (req.url().includes('/api/') || req.url().includes('user-organization')) {
        apiCalls.push({ method: req.method(), url: req.url() });
    }
});
page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/api/') || url.includes('user-organization')) {
        const matched = apiCalls.find((c) => c.url === url && !('status' in c && c.status));
        if (matched) {
            matched.status = resp.status();
            try { matched.body = await resp.json(); } catch { /* non-JSON */ }
        }
    }
});

await page.goto(process.env.BASE_URL + '/sign-in');
// ... drive the flow ...

writeFileSync('scratchpad/network-capture.json', JSON.stringify(apiCalls, null, 2));
```

> ⚠️ Exploration scripts and captured JSON are **temporary**. Put them in the
> scratchpad directory, never in `src/` or `tests/`. **Strip auth tokens, session
> cookies, and PII** before sharing or committing any sample captured by hand.

## Step 2: Capture DOM Snapshot + Candidate Locators

For each interactive element, record:

| Field            | Example                          | Why it matters                     |
| ---------------- | -------------------------------- | ---------------------------------- |
| Visible text     | `Log in`, `Email address`        | Maps to `label` option             |
| Tag / role       | `button`, `a`, `input`           | Picks the element class            |
| Placeholder      | `Search users...`                | Maps to `placeholder` option       |
| `id`             | `email-input`                    | Maps to `id` option (most stable)  |
| `href`           | `/forgot-password`               | Maps to `Link` `href` option       |
| `data-testid`    | `signin-submit`                  | Most stable; matches `testIdAttribute` |
| Wrapper class    | `.input`, `.select`, `.checkbox` | Confirms the wrapper convention    |
| Section          | header / main / footer           | Decides which container it lands in |

Prefer locators in this priority order (most stable first):
**`data-testid` → `id` → `label` (visible text) → `placeholder` → `href` → role/index fallback.**

## Step 3: Trigger User Flows + Capture Network

Drive the user flows the page supports — and after each action, capture what the
network did. Two flows are usually enough for a sign-in page; more for richer
screens.

### Flows to run (per screen)

| Action                       | What to record from the network                   |
| ---------------------------- | ------------------------------------------------- |
| Initial page load            | GET calls fired on mount (auth check, prefetch)   |
| Happy path action            | POST/PUT/PATCH that the primary CTA triggers      |
| One negative path            | Same endpoint with bad input — get the 4xx shape  |
| Refresh / refetch            | Any GET that fires after a mutation               |
| Navigation away              | Cleanup calls (e.g. `POST /signout`)              |

### Per-request inventory

Record one entry per distinct request:

```
POST /user-organization/auth/signin
  triggered by:  btnLogin.click() (Sign In Main container)
  request body: { email: string, password: string }
  responses:
    200 → { token: string, refreshToken?: string, expiresIn?: number, user?: {...} }
    401 → { message: "Invalid credentials" }
    400 → { errors: [{ field: "email", message: "Invalid format" }] }
```

### Save responses as JSON fixtures

When you capture a response body, save it to the scratchpad:

```
scratchpad/captures/
├── signin-200.json
├── signin-401.json
└── signin-validation-400.json
```

These feed two downstream skills:

-   [`write-api-test`](write-api-test.md) uses them to generate the JSON schema
    (`src/data/schemas/<module>/POST_<endpoint>_schema.json`)
-   [`mock-network`](mock-network.md) uses them as starter fixtures in
    `src/data/mocks/<feature>/<scenario>.json`

> ⚠️ Sanitize before committing — replace tokens with `"<TOKEN>"`, real emails
> with placeholders, internal IDs with stable fakes.

## Step 4: Map DOM → Element Classes

This framework wraps DOM in typed element classes. Match what you observed to the right class:

| You observe in the DOM                                  | Use element class | How to construct                                              |
| ------------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| `<button>Log in</button>`                               | `Button`          | `new Button({ parentLocator, label: 'Log in' })`             |
| `<input>` inside `.input` with a label                  | `Input`           | `new Input({ parentLocator, label: 'Email address' })`       |
| `<input placeholder="Search...">`                       | `Input`           | `new Input({ parentLocator, placeholder: 'Search...' })`     |
| `<input id="email">`                                    | `Input`           | `new Input({ parentLocator, id: 'email' })`                  |
| `<a href="/terms">Terms</a>`                            | `Link`            | `new Link({ parentLocator, label: 'Terms' })` or `{ href }`  |
| `.dropdown` / `.select` control                         | `Dropdown`        | `new Dropdown({ parentLocator, label: 'Country' })`          |
| `.checkbox` control                                     | `CheckBox`        | `new CheckBox({ parentLocator, label: 'Remember me' })`      |
| Static text / heading / error message                   | `Label`           | `new Label({ locator: container.locator('h1') })`            |
| `<img>` / icon                                          | `Image`           | `new Image({ parentLocator, ... })`                          |
| `<table>` with rows                                     | `Table`           | `new Table(container.locator('table'))`                      |
| A `<form>` wrapping inputs + submit                     | `Form`            | `new Form(container)` then `.getInput()` / `.getButton()`    |
| A radio button group                                    | `GroupRadioButton`| see `@elements/common/group-radio-button`                    |
| Loading placeholders                                    | `Skeleton`        | `new Skeleton({ parentLocator: container })`                 |
| Toast / banner notifications                            | (don't add here)  | Read from the `notification` fixture — see `docs/guidance/notifications.md` |

**Convention reminders** (from the wrapper implementations):

-   `Input` with `label` expects the input to live inside a `.input` container whose text matches the label exactly.
-   `Button`/`Link` with `label` match by **exact** visible text.
-   `Dropdown` expects a `.dropdown` wrapper containing a `.select`.
-   `CheckBox` expects a `.checkbox` wrapper.
-   If the DOM doesn't follow these conventions, fall back to a raw `locator` option and note it for review.

## Step 5: Map Network → API Service

Translate the captured requests into the project's service shape:

| You observe in the network                              | Use service shape                                            |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| All endpoints share a path prefix (`/user-organization/...`) | One service class with `super('/<prefix>')`             |
| Multi-level paths under one module                      | `super('/<prefix>')` + `this.endpoint('/<sub>')` per method  |
| RESTful CRUD (`GET /users`, `POST /users`, `DELETE /users/:id`) | Controller methods: `getAll()`, `create(body)`, `deleteById(id)` |
| Multipart upload                                        | `send('post', { multipart: {...} })`                         |
| Query params                                            | `send('get', { params: {...} })` — auto-normalized           |
| Auth-required endpoints                                 | `service.setToken(token)` — `Authorization: Bearer` header is auto-added |
| Public endpoints (login, forgot-password)               | Don't call `setToken()` — no auth header                     |

**Request/response types live in `@models/<module>/<module>.interface.ts`** (per
[create-api-service](create-api-service.md)'s Critical Rule). Don't co-locate them
with the service class.

## Step 6: Group Inventory

### UI inventory (feeds create-page-object)

Mirror the frontend structure:

```
Sign In screen (/sign-in)
├── Header
│   └── lblTitle      Label   h1 "Sign In"
├── Main
│   ├── txtEmail      Input   label "Email address"
│   ├── txtPassword   Input   label "Password"
│   ├── btnLogin      Button  label "Log in"
│   └── lnkForgot     Link    label "Forgot password?"
└── Footer
    ├── lnkTerms      Link    label "Terms"
    └── lnkPrivacy    Link    label "Privacy"
```

### API inventory (feeds create-api-service + write-api-test)

```
Service: UserOrganizationService
  base: /user-organization/auth

  signIn(body: SignInRequest)                  POST /signin
  logout(token)                                POST /logout
  forgetPassword(body: ForgetPasswordRequest)  POST /forget-password
  resetPassword(body: ResetPasswordRequest)    POST /reset-password

Models (@models/auth/user-organization.interface.ts):
  SignInRequest         { email, password }
  SignInResponse        { token, refreshToken?, expiresIn?, user? }
  ForgetPasswordRequest { email }
  ResetPasswordRequest  { token, password }

Captures (scratchpad/captures/):
  signin-200.json, signin-401.json, signin-validation-400.json
```

Confirm both inventories before generating code.

## Step 7: Hand Off — In Parallel

The two inventories are independent — generate UI and API artifacts concurrently.

### UI track
Follow [`create-page-object`](create-page-object.md):
1. Containers in `src/components/containers/<page-name>/`
2. Page object at `src/pages/<page-name>/index.ts`
3. Register in `src/fixtures/page-fixtures.ts`

### API track
Follow [`create-api-service`](create-api-service.md):
1. Models in `src/models/<module>/<module>.interface.ts`
2. Service class in `src/services/<module>.service.ts`
3. Register in `src/fixtures/service-fixtures.ts`

Then [`write-api-test`](write-api-test.md):
4. Spec in `tests/api/<module>/<endpoint>.spec.ts`
5. JSON schema in `src/data/schemas/<module>/POST_<endpoint>_schema.json` —
   bootstrap from a captured response via `validateJsonSchema('...', '...', body, true)`

## Step 8: Verify Both

### UI side
-   Re-run the browser session and confirm each captured locator matches **exactly one** element.
-   Flag anything that matches 0 or multiple elements; tighten the parent scope.

### API side
-   Run the API spec: `npm run test:api -- tests/api/<module>/`.
-   Adjust the typed `Response` interface and JSON schema if the live response shape
    differs from your capture (field renames, nesting, etc.).
-   For the negative cases, confirm the captured status codes (401 vs 403, 400 vs 422).

### Cleanup
Delete any exploration scripts, captures with real credentials, and scratch files.

## Critical Rules

-   ✅ **Discovery only** — this skill captures locators and endpoints; the downstream skills write the files.
-   ✅ **Capture both surfaces in one pass** — clicking through the UI is when network calls fire; observe them together.
-   ✅ **Save responses as scratchpad JSON** — they bootstrap schemas (`write-api-test`) and mocks (`mock-network`).
-   ✅ **Prefer stable locators** — `data-testid` → `id` → visible text → placeholder → role/index.
-   ✅ **Respect wrapper conventions** — `.input`, `.select`, `.checkbox`; raw `locator` only when needed.
-   ✅ **Use path aliases** in any generated code (`@elements/*`, `@components/*`, `@models/*`, `@services/*`).
-   ❌ **Never commit exploration scripts or unsanitized captures** — they live in the scratchpad.
-   ❌ **Never hardcode credentials** — use `Config.auth.*` and `Config.app.baseUrl`.
-   ❌ **Never put request/response types beside the service** — they go in `@models/<module>/`.

## Related Documentation

-   [`create-page-object.md`](create-page-object.md) — UI track: containers + page object
-   [`create-api-service.md`](create-api-service.md) — API track: service + models
-   [`write-api-test.md`](write-api-test.md) — API track: spec + schema validation
-   [`mock-network.md`](mock-network.md) — uses captured responses as mock fixtures
-   [`create-custom-element.md`](create-custom-element.md) — when the screen needs a new element type
