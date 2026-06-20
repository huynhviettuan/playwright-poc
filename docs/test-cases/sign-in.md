# Sign In — Test Cases

**Feature:** Authentication / Sign In **API Endpoint:** `POST /user-organization/auth/signin` **Last updated:**
2026-06-20

## Test Data

| Field    | Value            |
| -------- | ---------------- |
| Email    | `test@gmail.com` |
| Password | `Testing12345@`  |

> Credentials are sourced from `Config.auth.superAdminEmail` and `Config.auth.password` (`.env`). Never hardcode in
> tests.

## Preconditions (shared)

-   The QA tenant exists and the credentials above are active.
-   Browser starts unauthenticated (no stored session / cookies).
-   For UI tests: the Sign In page renders at `/sign-in`.
-   For API tests: `API_DOMAIN` env var resolves to the API host.

---

## E2E Test Cases (UI)

### TC-SI-E2E-001 — Sign in with valid credentials (happy path)

**Preconditions:** Browser at `/sign-in`, unauthenticated.

**Steps:**

1. Enter `test@gmail.com` into Email field.
2. Enter `Testing12345@` into Password field.
3. Click "Log in" button.

**Expected:**

-   User is redirected away from `/sign-in` (e.g. to dashboard).
-   Auth token / session cookie is persisted.
-   Email/password inputs are no longer on screen.
-   Success toast may appear with text matching `NotificationMessages.auth.loginSuccess`.

**Priority:** P0 (critical path)

---

### TC-SI-E2E-002 — Sign in with wrong password

**Preconditions:** Browser at `/sign-in`, unauthenticated.

**Steps:**

1. Enter valid email.
2. Enter incorrect password (e.g. `WrongPassword!`).
3. Click "Log in".

**Expected:**

-   User remains on `/sign-in`.
-   Toast appears matching `NotificationMessages.auth.loginFailed`.
-   Email field is preserved; password field is cleared (security best practice — verify against real app).

**Priority:** P0

---

### TC-SI-E2E-003 — Sign in with non-existent email

**Preconditions:** Browser at `/sign-in`, unauthenticated.

**Steps:**

1. Enter a random email that does not exist in the system (`DataGenerator.randomEmail('does-not-exist')`).
2. Enter any password.
3. Click "Log in".

**Expected:**

-   User remains on `/sign-in`.
-   Toast appears with the same generic message as TC-SI-E2E-002 (must NOT reveal whether the email exists — security).

**Priority:** P1

---

### TC-SI-E2E-004 — Sign in with empty email

**Steps:**

1. Leave Email empty.
2. Enter any password.
3. Click "Log in".

**Expected:**

-   Form does not submit (or submits and is rejected client-side).
-   Toast appears matching `NotificationMessages.validation.required`.

**Priority:** P2

---

### TC-SI-E2E-005 — Sign in with empty password

**Steps:**

1. Enter valid email.
2. Leave Password empty.
3. Click "Log in".

**Expected:**

-   Toast appears matching `NotificationMessages.validation.required`.

**Priority:** P2

---

### TC-SI-E2E-006 — Sign in with malformed email

**Steps:**

1. Enter `not-an-email` in Email field.
2. Enter any password.
3. Tab out / click "Log in".

**Expected:**

-   Toast appears matching `NotificationMessages.validation.invalidEmail`.

**Priority:** P2

---

### TC-SI-E2E-007 — Navigate to Forgot Password

**Steps:**

1. From `/sign-in`, click the "Forgot password?" link.

**Expected:**

-   User is navigated to the forgot-password screen.

**Priority:** P2

---

### TC-SI-E2E-008 — Password field is masked

**Steps:**

1. Enter any value in Password field.

**Expected:**

-   Characters are rendered as dots/asterisks (`type="password"` input).
-   A show/hide toggle may exist — if so, toggling reveals the plaintext.

**Priority:** P3

---

### TC-SI-E2E-009 — Login button disabled while submitting

**Steps:**

1. Enter valid credentials.
2. Click "Log in" once.
3. Observe the button before the response returns.

**Expected:**

-   Button becomes disabled / shows loading state to prevent duplicate submits.

**Priority:** P3

---

## API Test Cases

### TC-SI-API-001 — Valid credentials return token (happy path)

**Endpoint:** `POST /user-organization/auth/signin`

**Body:**

```json
{ "email": "test@gmail.com", "password": "Testing12345@" }
```

**Expected:**

-   HTTP `200` (or `201`).
-   Response body contains a non-empty auth token (field name to be verified — likely `token`, `accessToken`, or
    `data.token`).
-   Response matches the JSON schema at `src/data/schemas/auth/POST_signin_schema.json`.

**Priority:** P0

---

### TC-SI-API-002 — Wrong password returns 401

**Body:**

```json
{ "email": "test@gmail.com", "password": "WrongPassword!" }
```

**Expected:**

-   HTTP `401`.
-   Generic error message (does not reveal whether the email exists).
-   No token in body.

**Priority:** P0

---

### TC-SI-API-003 — Non-existent email returns 401

**Body:**

```json
{ "email": "no-such-user@example.com", "password": "AnyPassword1!" }
```

**Expected:**

-   HTTP `401` (same as wrong password — must not allow user enumeration).

**Priority:** P1

---

### TC-SI-API-004 — Missing email field returns 400

**Body:** `{ "password": "Testing12345@" }`

**Expected:**

-   HTTP `400` with a validation error referencing the email field.

**Priority:** P2

---

### TC-SI-API-005 — Missing password field returns 400

**Body:** `{ "email": "test@gmail.com" }`

**Expected:**

-   HTTP `400` with a validation error referencing the password field.

**Priority:** P2

---

### TC-SI-API-006 — Malformed email returns 400

**Body:** `{ "email": "not-an-email", "password": "Testing12345@" }`

**Expected:**

-   HTTP `400` with a validation error referencing email format.

**Priority:** P2

---

### TC-SI-API-007 — Empty body returns 400

**Body:** `{}`

**Expected:**

-   HTTP `400`.

**Priority:** P3

---

## Items to Verify on First Run

This document was authored without driving the live UI (no Chrome MCP available). The following items should be
confirmed during the first execution and the spec/page-object updated accordingly:

-   [ ] Exact route path (`/sign-in` vs `/login` vs `/`)
-   [ ] DOM selectors for email input, password input, log-in button (the current page object uses `.input` + label
        match — confirm against the real DOM)
-   [ ] Exact toast selector — `Toast` defaults to `.toast, .notification, .alert`; confirm one of these matches the
        toast component, otherwise pass a custom selector to the `Toast` constructor
-   [ ] Exact error message text vs the placeholders in `NotificationMessages.auth.loginFailed`
-   [ ] Whether a success toast appears, and its text
-   [ ] Post-login redirect URL
-   [ ] Exact response shape from `POST /user-organization/auth/signin` (token field name, nested or flat)
-   [ ] HTTP status codes used for validation errors (`400` vs `422`)
