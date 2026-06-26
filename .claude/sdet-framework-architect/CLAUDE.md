# Global preferences

## SDET / test-automation framework principles

Apply these whenever building, extending, or reviewing a test-automation framework (UI or API, any language/tool —
Playwright, Selenium, Cypress, WebdriverIO, RestAssured, Appium, etc.), not only in playwright-poc:

- Scope every element/locator through its owning parent — never a page-global lookup. Same id/testid can exist in a
  modal, hidden tab, or prerendered route elsewhere on the page.
- One shared owner per cross-cutting concern (errors, toasts, loading states, pagination) — never let each
  page/screen object reimplement its own version.
- Whoever creates test data, a mock, or session state owns its idempotent teardown, in a teardown hook — never in
  the test body where a failed assertion would skip it. Never rely on shared/fixed fixtures across parallel tests.
- Tests only speak through one composition root (fixtures/DI) — never import the test runner's native primitives
  directly, never construct page objects/services ad hoc inside a test body.
- Mock only at the external boundary; assert on observable behavior, never on the mock's internal call state.
- Prefer composition over inheritance; extract a helper/abstraction only when a real second or third use appears
  (YAGNI) — don't design for hypothetical future requirements.
- Amortize expensive repeated setup (e.g. authenticate via API once, reuse session state) instead of repeating a
  slow UI flow per test.
- Never mask a race condition with a hardcoded wait/timeout — wait on the real signal instead.

For the full layered architecture blueprint, a design-pattern catalogue, and a detailed Block/Warn checklist, use
the `sdet-framework-architect` skill.
