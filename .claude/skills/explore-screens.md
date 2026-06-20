# Skill: Explore Screens

## When to Use

Use this skill when you need to **inspect a live screen/page in the browser**, capture its real
locators, and turn them into a page object. This skill is the *discovery* step that feeds the
[`create-page-object`](create-page-object.md) skill (the *generation* step).

Typical triggers:

-   "Explore the Sign In screen and generate its page object"
-   "Open the Users page and create the locators for me"
-   "Inspect this URL and scaffold containers + page object"

## Workflow Overview

```
1. Launch / connect to the screen   →  browser exploration tool
2. Capture DOM snapshot + locators  →  record candidate selectors
3. Map DOM → element classes        →  Input/Button/Link/Dropdown/...
4. Group elements by section         →  Header / Main / Footer containers
5. Hand off to create-page-object    →  generate containers + page object
6. Verify locators resolve           →  run a quick smoke check
```

## Step 1: Launch / Connect to the Screen

Pick **one** exploration method based on what is available:

### Option A — Claude in Chrome (preferred when available)

Use the connected browser MCP tools to drive a real browser session:

1. `navigate` to the target URL (use `Config.app.baseUrl` + the route, e.g. `Endpoints.auth.signIn`).
2. `read_page` / `get_page_text` to capture the accessibility tree and visible text.
3. `find` to locate specific controls by role/name when you need exact selectors.
4. `read_console_messages` only if the screen depends on async rendering and you must confirm it loaded.

### Option B — Playwright codegen / inspector

When no live browser MCP is connected, drive Playwright directly:

```bash
# Opens the inspector; click elements to read suggested locators
npx playwright codegen <baseUrl>/<route>
```

Or write a throwaway exploration script in the scratchpad that navigates and dumps locators:

```ts
// scratchpad only — never commit this
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto(process.env.BASE_URL + '/sign-in');

// Dump candidate controls
console.log(await page.locator('button, a, input, .input, .select, .checkbox').allInnerTexts());
```

> ⚠️ Exploration scripts are **temporary**. Put them in the scratchpad directory, never in `src/` or `tests/`.

## Step 2: Capture DOM Snapshot + Candidate Locators

For each interactive element, record:

| Field            | Example                          | Why it matters                     |
| ---------------- | -------------------------------- | ---------------------------------- |
| Visible text     | `Log in`, `Email address`        | Maps to `label` option             |
| Tag / role       | `button`, `a`, `input`           | Picks the element class            |
| Placeholder      | `Search users...`                | Maps to `placeholder` option       |
| `id`             | `email-input`                    | Maps to `id` option (most stable)  |
| `href`           | `/forgot-password`               | Maps to `Link` `href` option       |
| Wrapper class    | `.input`, `.select`, `.checkbox` | Confirms the convention the wrapper expects |
| Section          | header / main / footer           | Decides which container it lands in |

Prefer locators in this priority order (most stable first):
**`id` → `label` (visible text) → `placeholder` → `href` → role/index fallback.**

## Step 3: Map DOM → Element Classes

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
| Static text / heading / error message                   | `Label`           | `new Label(container.locator('h1'))`                         |
| `<img>` / icon                                          | `Image`           | `new Image({ parentLocator, ... })`                          |
| `<table>` with rows                                     | `Table`           | `new Table(container.locator('table'))`                      |
| A `<form>` wrapping inputs + submit                     | `Form`            | `new Form(container)` then `.getInput()` / `.getButton()`    |
| A radio button group                                    | `GroupRadioButton`| see `@elements/common/group-radio-button`                    |
| Loading placeholders                                    | `Skeleton`        | `new Skeleton({ parentLocator: container })`                 |

**Convention reminders (from the wrapper implementations):**

-   `Input` with a `label` expects the input to live inside a `.input` container whose text matches the label exactly.
-   `Button`/`Link` with a `label` match by **exact** visible text.
-   `Dropdown` expects a `.dropdown` wrapper containing a `.select`.
-   `CheckBox` expects a `.checkbox` wrapper.
-   If the DOM does **not** follow these conventions, fall back to a raw `locator` option
    (e.g. `new Button({ locator: $('[data-test="submit"]') })`) and note it for review.

## Step 4: Group Elements Into Sections

Mirror the frontend structure (see `create-page-object`):

-   **Header** — logo, title, top nav
-   **Main** — the primary form / table / content
-   **Footer** — copyright, secondary links

Produce a short element inventory before generating code, e.g.:

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

Confirm this inventory with the user (or proceed if they asked for it directly) before generating files.

## Step 5: Hand Off to `create-page-object`

Once the inventory is ready, follow the [`create-page-object`](create-page-object.md) skill exactly:

1. Create containers in `src/components/containers/[page-name]/`.
2. Compose the page object in `src/pages/[page-name].page.ts`.
3. Register it in fixtures.
4. Follow the naming conventions (`btn`, `txt`, `lbl`, `lnk`, `chk`, `drp`, `tbl`).

The inventory from Step 4 maps 1:1 onto the container fields, so generation is mechanical.

## Step 6: Verify Locators Resolve

Before considering the work done, smoke-check that the generated locators actually resolve on the live screen:

-   Re-use the browser session from Step 1 to confirm each captured selector matches **exactly one** element.
-   Flag any locator that matches 0 or multiple elements — refine it (add a parent scope, switch to `id`, or use `index`).
-   If you wrote a throwaway exploration script, delete it from the scratchpad when finished.

## Critical Rules

-   ✅ **Discovery only** — this skill captures locators; `create-page-object` writes the files.
-   ✅ **Prefer stable locators** — `id` and visible text over brittle CSS/index.
-   ✅ **Respect wrapper conventions** — `.input`, `.select`, `.checkbox`; fall back to raw `locator` only when needed.
-   ✅ **Use path aliases** in any generated code (`@elements/*`, `@components/*`).
-   ❌ **Never commit exploration scripts** — they live in the scratchpad and get deleted.
-   ❌ **Never hardcode credentials** — use `Config.auth.*` and `Config.app.baseUrl`.

## Related Documentation

-   `.claude/skills/create-page-object.md` — generates containers + page object from the inventory
-   `.claude/skills/create-custom-element.md` — when the screen needs a new element type
-   `.claude/skills/write-e2e-test.md` — write tests against the generated page object
