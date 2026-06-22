# ADR-005: BrowserInstance Static Singleton

## Status
Accepted

## Date
2026-06-22

## Context

`BrowserInstance` uses static class variables (`_browser`, `_currentPage`, `_currentContext`) to
manage the Playwright browser lifecycle. Every element, page object, and helper in the framework
reads `BrowserInstance.currentPage` to locate elements on screen.

Two concerns were raised:

1. **Thread safety** — static mutable state is normally unsafe when code runs concurrently.
   If two tests execute in the same process and share the singleton, one test could overwrite
   the page reference while the other is mid-assertion.
2. **Testability** — global state makes it harder to reason about which page a test is using,
   and prevents injecting a mock page for unit-level checks on page objects.

An `AsyncLocalStorage` (ALS) refactor was attempted to give each test its own isolated page
binding without changing the call sites. It failed: Playwright's fixture `use()` callback runs
the test body in a different async context than the fixture setup, so ALS state set in the
fixture is invisible inside the test.

## Decision

**Keep the static singleton.** It is safe under Playwright's execution model and the ALS
alternative is provably broken.

### Why it is safe

Playwright's parallelism is **process-based**, not thread-based:

- Each **worker** is a separate Node.js child process with its own memory space.
- Static variables in one worker are completely invisible to every other worker.
- Tests within a single worker run **sequentially** (even with `fullyParallel: true`, Playwright
  only parallelises across workers, not within one).

Therefore:

- Two tests in different workers → different processes → different `BrowserInstance` statics. No conflict.
- Two tests in the same worker → run sequentially → one finishes and cleans up before the next starts. No conflict.

This was verified empirically by running the `browser-instance.spec.ts` suite with
`workers: 2` and `fullyParallel: true`. All tests pass, including the test that asserts
no state bleeds between consecutive tests.

### The `usePage` escape hatch

For the rare case where a single test needs to operate on a second page (e.g. multi-tab
workflows), the `usePage(page, callback)` helper temporarily overrides `currentPage` for
the duration of the callback using `AsyncLocalStorage`. This works because the override
and the reads happen in the **same** async context (the test body), unlike the
fixture→test boundary that broke the full ALS approach.

## Consequences

**Positive:**
- Zero refactoring cost — every existing call site (`BrowserInstance.currentPage`, `$()`,
  `$getByText()`, etc.) continues to work unchanged.
- No performance overhead from ALS or fixture indirection.
- Simple mental model: one worker = one page at a time.
- `usePage` covers multi-tab scenarios without changing the default path.

**Negative:**
- Cannot run tests concurrently **within** a single worker. This is a Playwright constraint,
  not a BrowserInstance one — Playwright itself does not support intra-worker concurrency.
- Page objects cannot be unit-tested in isolation without a running browser, because they
  implicitly read `BrowserInstance.currentPage`. Accepted trade-off: the framework is an
  E2E tool, not a unit-testable library.
- If Playwright ever adds intra-worker concurrency, this decision must be revisited.

## Alternatives Considered

### 1. AsyncLocalStorage per-test isolation
- **Attempted and failed.** Playwright's `use()` boundary creates a new async context,
  so ALS state set in fixture setup is not visible in the test body.
- Would have been the ideal solution if it worked.

### 2. Inject page via fixture parameter
- Pass `page` explicitly to every page object constructor: `new SignInPage(page)`.
- **Rejected.** Would require changing every page object, container, element, and helper
  to accept and thread through a `page` parameter. Massive churn for no practical benefit,
  since Playwright's process isolation already prevents conflicts.

### 3. Playwright's built-in `page` fixture only
- Stop using `BrowserInstance` entirely; use `page` from Playwright fixtures directly.
- **Rejected.** Loses multi-tab support (`startNewPage`, `switchToPreviousPage`,
  `switchToTabByIndex`), mobile context detection, and the `$()` / `$getByText()` shorthand
  functions that the entire element layer depends on.

## References

- `src/common/browser.ts` — BrowserInstance implementation
- `tests/e2e/framework/browser-instance.spec.ts` — isolation and `usePage` tests
- Playwright docs: [Parallelism](https://playwright.dev/docs/test-parallel) — confirms worker = process
