# Sign In

**Feature:** Authentication / Sign In **Application:** ESG Lion
([https://esg-lion.dev.dgnx.io/](https://esg-lion.dev.dgnx.io/)) **Status:** Accepted **Last updated:** 2026-06-20

## Story

> **As** an authenticated user of the ESG platform, **I want** to sign in with my email and password, **so that** I can
> access my organization's workspace and continue my work.

## Acceptance Criteria

| AC   | Statement                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| AC-1 | A user with valid email + password can sign in and is taken to their workspace dashboard.                            |
| AC-2 | A user with the wrong password sees a generic "Invalid credentials" message; they remain on the sign-in screen.      |
| AC-3 | A user entering an email that does not exist in the system sees the **same** generic error as AC-2 (no enumeration). |
| AC-4 | The password field masks input by default (rendered as dots/asterisks).                                              |
| AC-5 | A "Forgot password?" link is visible on the sign-in screen and routes the user to the forgot-password flow.          |
| AC-6 | Submitting with an empty email or empty password is blocked, with a clear "required field" message.                  |
| AC-7 | Submitting with a malformed email (e.g. `not-an-email`) is blocked with a clear format error.                        |

## Business Rules

-   Generic error messages on AC-2 and AC-3 are a **security requirement**: the response copy and HTTP status must be
    identical, so an attacker cannot probe for existing accounts.
-   Session tokens are issued by `POST /user-organization/auth/signin` and used for all subsequent API calls.
-   The sign-in form must be reachable directly at `/sign-in` without authentication.

## Out of Scope

This story does **not** cover:

-   Sign-up / account creation flow (separate story).
-   Multi-factor authentication (separate story).
-   "Remember me" persistence (separate story).
-   Social sign-in / SSO (separate story).
-   Rate limiting on sign-in attempts (separate operational concern — track in [docs/decisions/](../decisions/) once
    defined).
-   Password reset flow (covered by the Forgot Password story).
-   Session expiry / refresh-token behavior (separate story).

## References

-   Test cases generated from this story: [docs/test-cases/sign-in.md](../test-cases/sign-in.md)
-   API service: [src/services/user-organization.service.ts](../../src/services/user-organization.service.ts)
-   Page object: [src/pages/sign-in/index.ts](../../src/pages/sign-in/index.ts)
