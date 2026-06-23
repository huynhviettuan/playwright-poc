# Skill: Generate Test Cases

## When to Use

Use this skill when you need to **produce a manual test-case document** for a feature — the markdown that lives under
`docs/test-cases/<feature>.md` and feeds the [`write-e2e-test`](write-e2e-test.md) and
[`write-api-test`](write-api-test.md) skills.

Two starting points are supported:

1. **User story available** (preferred) — read it first, extract acceptance criteria, then explore the screen, then map
   ACs + discovered behaviors into test cases.
2. **No user story** — proceed from exploration alone, but flag the gap in the output and ask the user to confirm
   coverage assumptions.

Typical triggers:

-   "Write test cases for the Sign In feature — here's the story"
-   "Generate the test case doc for /users from the user story in `docs/user-stories/users.md`"
-   "There's no story yet — explore /reports and propose test cases to validate"

## Workflow Overview

```
1. Read the user story (if available)        → extract acceptance criteria
2. Explore the screen + capture network      → delegate to explore-screens
3. Map ACs → test cases                       → one or more cases per AC
4. Add coverage the AC didn't specify         → security, validation, edge
5. Write the test case markdown               → docs/test-cases/<feature>.md
6. Confirm scope with the user                → before handing off to specs
7. Hand off                                    → write-e2e-test + write-api-test
```

## Step 1: Read the User Story

**Always check for a user story first.** Sources, in order of preference:

| Source                                  | How to consume                                        |
| --------------------------------------- | ----------------------------------------------------- |
| File in the repo (`docs/user-stories/`) | Read it directly                                      |
| Linear / Jira / Notion URL              | Fetch via WebFetch or whatever MCP tool is available  |
| Pasted into chat                        | Take it verbatim — don't paraphrase before extraction |
| None available                          | Tell the user and offer to proceed exploration-only   |

### Extract the structured pieces

From whatever format the story is in, capture:

| Field                   | What you need                                                       |
| ----------------------- | ------------------------------------------------------------------- |
| **Feature name**        | One short noun phrase (e.g. "Sign In", "User Invitation")           |
| **Role(s)**             | Who triggers the flow ("admin", "viewer", "any authenticated user") |
| **Goal / value**        | The "so that" clause                                                |
| **Acceptance criteria** | A numbered list of testable conditions                              |
| **Business rules**      | Constraints not in ACs (e.g. "tokens expire after 15min")           |
| **Out of scope**        | Anything the story explicitly excludes                              |

If the story is freeform prose, distill it into the table above before continuing. Numbered acceptance criteria become
**AC-1, AC-2, …** and are referenced from every test case derived from them.

### Example extraction

> _Original story:_ "As a user with valid credentials, I want to sign in so that I can access my workspace. The system
> must reject invalid credentials with a generic message, must not reveal whether the email exists, and must mask the
> password input. Forgot-password link must be available."

Becomes:

| AC   | Statement                                                     |
| ---- | ------------------------------------------------------------- |
| AC-1 | Valid credentials → successful sign-in + workspace access     |
| AC-2 | Invalid credentials → generic error message                   |
| AC-3 | Non-existent email → same generic error (no user enumeration) |
| AC-4 | Password input is masked                                      |
| AC-5 | Forgot-password link is accessible from the sign-in screen    |

## Step 2: Explore the Screen

Follow [`explore-screens.md`](explore-screens.md) — capture **both** the UI inventory and the API inventory in one pass.
The captured network responses become the source of truth for expected status codes, response shapes, and error payloads
in the API test cases.

If no user story exists, the exploration also surfaces:

-   What states the page renders (loading, empty, populated, error)
-   What user actions are possible
-   What errors the app can show

Use this to **propose** coverage the user can confirm.

## Step 3: Map ACs → Test Cases

For each AC, write **one or more test cases**. One AC often becomes multiple cases because it implies both a happy path
and edge cases. Example:

| AC                                  | Test cases that cover it                             |
| ----------------------------------- | ---------------------------------------------------- |
| AC-1: Valid credentials → workspace | TC-E2E-001 (happy path)                              |
| AC-2: Invalid credentials → error   | TC-E2E-002 (wrong password)                          |
| AC-3: No user enumeration           | TC-E2E-003 (non-existent email — same error as AC-2) |
| AC-4: Password masked               | TC-E2E-008 (`type="password"` attribute)             |
| AC-5: Forgot-password link          | TC-E2E-007 (link navigates)                          |

Every test case body must reference the AC(s) it covers:

```markdown
### TC-SI-E2E-002 — Sign in with wrong password

**Covers:** AC-2 ...
```

## Step 4: Add Coverage the AC Didn't Specify

Acceptance criteria rarely cover every real-world failure mode. Add cases for the categories below — clearly labeled so
they're not confused with AC-driven cases:

| Category                | Examples                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| **Form validation**     | Required fields, malformed email, max-length, special chars           |
| **API negatives**       | 400 missing field, 400 malformed body, 422 validation, 429 rate limit |
| **Security**            | XSS in input, SQL injection probes, IDOR (if applicable)              |
| **Loading / async**     | Button disabled while submitting, skeleton hides before interaction   |
| **Empty / edge states** | Empty list, zero results, single item, very large list                |
| **Accessibility**       | Keyboard nav, screen-reader labels, focus management                  |
| **Cross-browser**       | Only flag if a known compatibility risk exists                        |

Label them: `**Covers:** Inferred — <category>`. This makes it obvious in review which cases the user story explicitly
required vs which were added defensively.

> ⚠️ Do **not** invent business rules. If the user story doesn't say "password must be at least 8 characters," don't
> write a test that asserts it. Flag the gap and ask.

## Step 5: Write the Test Case Markdown

Output location: `docs/test-cases/<feature>.md`

Use the template at the end of this skill, derived from [docs/test-cases/sign-in.md](../../docs/test-cases/sign-in.md).

### Test-case ID convention

`TC-<FEATURE-PREFIX>-<TYPE>-<NNN>`

-   `FEATURE-PREFIX` — 2-3 letter feature code (`SI` for Sign In, `USR` for Users, `INV` for Invitation)
-   `TYPE` — `E2E` or `API`
-   `NNN` — zero-padded sequence within the type (`001`, `002`, …)

### Priority levels

| Priority | Meaning                                                          |
| -------- | ---------------------------------------------------------------- |
| **P0**   | Critical path — failure blocks the release                       |
| **P1**   | Important — should not ship broken, but won't gate release alone |
| **P2**   | Validation / edge — catches regressions in defensive logic       |
| **P3**   | UX polish — nice-to-have, can be deferred                        |

Rule of thumb: **AC happy paths and critical security cases are P0**; AC negatives and key validations are P1; inferred
edge cases are P2-P3.

## Step 6: Confirm Scope With the User

Before declaring the doc done, present a brief summary:

```
Feature: Sign In
ACs covered: 5/5 (AC-1 through AC-5)
Test cases generated:
  E2E: 8 cases (TC-SI-E2E-001 → 008) — covers AC-1, AC-2, AC-3, AC-4, AC-5 + 3 inferred
  API: 7 cases (TC-SI-API-001 → 007) — covers AC-2, AC-3 + 5 inferred (validation, security)
Gaps flagged for user:
  - AC-1 says "workspace access" — exact redirect target not in the story
  - No mention of rate limiting — left out, can add if confirmed
```

The user accepts, adjusts, or adds — then move on.

## Step 7: Hand Off to the Spec Skills

The test case doc is now the contract. The automated specs follow:

-   [`write-e2e-test`](write-e2e-test.md) — one Playwright spec per E2E test case, with the TC ID as the test name
-   [`write-api-test`](write-api-test.md) — one Playwright API spec per API test case, schema-validated against the
    captures from `explore-screens`

Specs MUST reference the TC ID in the test name so failures are traceable back to the AC:

```ts
test('TC-SI-E2E-002 — should reject wrong password', async ({ signInPage, notification }) => {
    // ...
});
```

## Critical Rules

-   ✅ **Read the user story first** when one exists — don't paraphrase before extracting ACs.
-   ✅ **Every AC-driven test case cites its AC** in the body (`**Covers:** AC-N`).
-   ✅ **Inferred cases are labeled inferred** — never mixed in as if the user story required them.
-   ✅ **Cover negative paths** even if the user story doesn't list them — flag them as inferred.
-   ✅ **Trace TC IDs in spec names** so test failures link back to the AC.
-   ✅ **Capture API responses during exploration** — they become the schema source.
-   ❌ **Never invent business rules.** If the user story doesn't specify, flag the gap and ask.
-   ❌ **Never skip exploration** even with a perfect user story — discovered behaviors round out the cases the AC
    missed.

## Template

Save as `docs/test-cases/<feature>.md`. Replace placeholders. Add or remove sections to match the feature.

````markdown
# <Feature Name> — Test Cases

**Feature:** <Feature> **Application:** <App URL or alias> **API Endpoint(s):** <comma-separated endpoint paths> **User
Story:** <path or URL, e.g. `docs/user-stories/<feature>.md`> **Last updated:** <YYYY-MM-DD>

## Acceptance Criteria (from user story)

| AC   | Statement |
| ---- | --------- |
| AC-1 | ...       |
| AC-2 | ...       |

## Test Data

| Field | Value |
| ----- | ----- |
| ...   | ...   |

> Credentials are sourced from `Config.auth.*` (`.env`). Never hardcode in tests.

## Preconditions (shared)

-   ...

---

## E2E Test Cases (UI)

### TC-<PFX>-E2E-001 — <Short title>

**Covers:** AC-1 **Preconditions:** ...

**Steps:**

1. ...

**Expected:**

-   ...

**Priority:** P0

---

### TC-<PFX>-E2E-002 — ...

**Covers:** AC-2

...

---

## API Test Cases

### TC-<PFX>-API-001 — <Short title>

**Covers:** AC-N **Endpoint:** `<METHOD /path>`

**Body:**

```json
{ "...": "..." }
```
````

**Expected:**

-   HTTP <status>.
-   Response matches `src/data/schemas/<module>/<METHOD>_<endpoint>_schema.json`.
-   ...

**Priority:** P0

---

## Items to Verify on First Run

This document was generated from a user story + exploration. Confirm during the first execution and update the spec /
page object / API service accordingly:

-   [ ] Exact response shape matches the typed `Response` interface
-   [ ] Toast / error copy matches `NotificationMessages.*`
-   [ ] Post-action redirect target
-   [ ] HTTP status codes for validation errors (`400` vs `422`)

```

## Related Documentation

-   [`explore-screens.md`](explore-screens.md) — UI + API discovery (Step 2 of this workflow)
-   [`write-e2e-test.md`](write-e2e-test.md) — generates Playwright E2E specs from this doc
-   [`write-api-test.md`](write-api-test.md) — generates Playwright API specs from this doc
-   [`docs/test-cases/sign-in.md`](../../docs/test-cases/sign-in.md) — reference implementation following this skill
-   [`docs/test-cases/README.md`](../../docs/test-cases/README.md) — test-case folder conventions
```
