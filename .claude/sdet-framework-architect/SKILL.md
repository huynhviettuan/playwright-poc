---
name: sdet-framework-architect
description: >
  Framework-agnostic SOLID/clean-code/design-pattern knowledge for building or reviewing SDET test-automation
  frameworks (UI, API, or both) in ANY language or tool — Playwright, Selenium, Cypress, WebdriverIO, RestAssured,
  Appium, etc. Use this skill whenever starting a new test-automation repo/framework from scratch, designing or
  reviewing a page-object / screen-object / element hierarchy, designing an API service layer, deciding how to wire
  dependency injection or fixtures for tests, or explicitly asked to apply SOLID/DRY/YAGNI/KISS to test code. Trigger
  on phrases like "new test framework", "test automation architecture", "page object design", "SOLID for test
  automation", "clean code for tests", "design a QA framework", "structure this automation repo". Distilled from a
  mature production Playwright/TypeScript framework and cross-checked against a mature Java/Selenium/TestNG
  framework (a thread-based parallel runner, vs. Playwright's process-based model), but every rule here is stated
  tool-agnostically — do not assume the target repo uses Playwright, TypeScript, Selenium, or Java.
---

# SDET Framework Architect

Reusable architectural knowledge for building test-automation frameworks that stay maintainable as they grow:
consistent structure, low coupling, no flakiness from shared state. It generalizes a proven layered design so it can
seed a brand-new repo or review/refactor an existing one, in any language or tool.

**How to use this skill:** read this file first for the blueprint, non-negotiables, and decision framework. Load a
`references/*.md` file only when you need the deeper material it covers:

- [`references/architecture-blueprint.md`](references/architecture-blueprint.md) — the five-layer design in detail,
  generic pseudocode per layer, plus one labeled real-code example per layer.
- [`references/design-patterns-catalogue.md`](references/design-patterns-catalogue.md) — ~15 classic design patterns
  mapped to test-automation use cases, each with the SOLID principle it serves.
- [`references/principles-and-anti-patterns.md`](references/principles-and-anti-patterns.md) — the full SOLID/DRY/
  YAGNI/KISS checklist, a tiered (Block/Warn/Nit) review list, and cross-project reuse rules.

## Core layered blueprint

A test-automation framework is a small application in its own right. Structure it in five layers, each with one job:

1. **Element/Control layer** — one class per interactive UI primitive (button, input, dropdown, table…), wrapping
   the underlying driver's locator/selector API behind a stable interface. *Why:* isolates the framework from the
   underlying tool's API surface (Adapter) — swapping or upgrading the driver touches one layer, not every test.
2. **Container/Screen layer** — logical regions of a screen (header, main, footer, a repeated card/row) as small
   objects, each scoped to its own root locator, composed into a page/screen object. *Why:* Single Responsibility
   per region; scoping prevents one region's element from ever accidentally matching another (a top cause of
   flakiness in ad hoc frameworks). A stricter variant defines the page itself as an interface with exactly one
   implementation class holding locators, so every caller (tests, other pages) depends only on the interface type —
   see "Repository/interface-impl separation" in the patterns catalogue.
3. **Service/API layer** — one class per API resource/controller, one method per endpoint, with a base class fixing
   the invariant request/response mechanics (URL building, auth, error handling, logging). *Why:* Template Method —
   concrete services declare only *what* endpoint to call; *how* a request is made is defined once.
4. **Composition root (DI/fixtures)** — a single place where element/container/page objects, services, and test
   data factories are wired together and handed to tests, instead of tests constructing dependencies themselves.
   *Why:* Dependency Inversion — tests depend on "what I need" (an injected object), not on concrete constructors;
   swapping an implementation means editing one file, not every test.
5. **Driver/session instance holder** — one place holding the current browser/session/client handle: a static
   singleton if the runner is process-parallel (one worker = one OS process), or a thread-local registry if the
   runner is thread-pool-based and can run multiple test methods concurrently within one process (see the decision
   framework below). *Why:* every element/page/service needs an ambient reference to "the current session" without
   threading it through every constructor — but the concurrency model decides which holder shape is actually safe.

See [`references/architecture-blueprint.md`](references/architecture-blueprint.md) for pseudocode and a worked
example per layer.

## Non-negotiable rules

These are the highest-impact rules — apply them regardless of stack:

- **Scope every element through its parent, never through a page-global lookup.** The same identifier/testid can
  appear in a modal, a hidden tab, or a prerendered route. A global "find this id anywhere on the page" is a
  flakiness source; always resolve through the owning container's locator.
- **One owner per cross-cutting UI concern.** Toasts, inline errors, loading skeletons, pagination — build one
  shared component/fixture for each and reuse it. Never let every page/screen object reimplement its own version.
- **Whoever creates test data, a mock, or session state owns tearing it down**, in an idempotent teardown
  hook/fixture — never in the test body, where a thrown assertion skips it. Never depend on a shared/fixed
  fixture user or record across parallel tests.
- **Tests only speak through the composition root.** Never import the test runner's native test/assert primitives
  directly, and never construct page objects/services ad hoc inside a test body — go through the one wiring point
  so cross-cutting capabilities (custom assertions, fixtures, reporting hooks) stay centrally swappable.
- **Mock only at the external boundary; assert on observable behavior.** Intercept the network/external dependency,
  never the internals of your own object graph. Never assert "the mock was called" — assert what the user/consumer
  actually sees change.
- **Prefer composition over inheritance; extract a helper class only when a real second or third use appears.**
  Don't pre-build a hierarchy or a reusable abstraction for a single current caller (YAGNI). When a widget mixes
  distinct concerns (e.g., navigation state + data parsing), split those into single-purpose helper classes and
  compose them, rather than growing one class or a deep inheritance chain.
- **Authenticate/set up expensive state once, then reuse it** (e.g., API-based login persisted as session state)
  instead of repeating a slow, flake-prone UI flow at the start of every test. Reserve the full UI flow for the
  test(s) whose actual subject is that flow.
- **Never mask a race condition with a hardcoded wait/timeout.** Fix the underlying synchronization (wait for the
  real signal — a response, a state change, an element condition) rather than widening a sleep.

## Decision framework

Use these thresholds when the "right" structure isn't obvious:

| Question | Rule of thumb |
|---|---|
| Inheritance or composition for a new element/object? | Inheritance only when "is-a" genuinely holds and the subclass needs *all* of the parent's behavior. Otherwise compose smaller objects (e.g., a dropdown is not a "clickable" — it *has* a trigger and *has* option rows). |
| Extract a helper class or keep logic inline? | Inline for a single concern used once. Extract when a class starts doing two unrelated things (e.g., "navigate the calendar" and "parse the displayed date") — split before the third method that needs both. |
| Singleton or factory for a repeated screen region? | Singleton only for truly global, one-per-run resources (the driver/session instance, a global notification bar). Anything that appears more than once per screen (repeated cards, dynamic tabs, per-item rows) must be a factory-created, independently-scoped instance — a singleton section causes state bleed between instances. |
| Inline API method or a child service class? | Inline for 1-2 sub-endpoints on a resource. Extract a nested/child service once a sub-resource has 3+ endpoints of its own, composing it into (not inheriting from) the parent service, and delegating shared auth/headers to the parent. |
| Full Gherkin/BDD or a lightweight Given/When/Then helper? | Full Gherkin (`.feature` files + step registry) only when non-technical stakeholders will *author* scenarios themselves. When they only need to *read* readable output, use a thin typed step-wrapper over your existing test framework — same readability, no parser/registry maintenance burden. |
| Share a component across multiple product repos? | Share only the element/control vocabulary layer (a Button, Input, Table primitive) with injectable selectors/config — see "share the vocabulary, not the sentences" in [`references/principles-and-anti-patterns.md`](references/principles-and-anti-patterns.md). Never share page/screen objects, endpoint definitions, UI copy constants, or env/test data across products — those are product-specific and become a configuration nightmare when forced to serve two products from one source. |
| Static singleton or thread-local for the driver/session holder? | Static singleton only if the runner is process-parallel with sequential execution within each process (e.g. a worker-per-test-file model). Thread-local (or equivalent thread-scoped storage) if the runner is thread-pool-based and reuses one test-class instance across concurrently-running test methods (e.g. TestNG/JUnit `parallel="methods"`) — and in that case, never cache the driver, a log-correlation id, or any other per-test state in an instance field; always resolve it fresh from thread-local storage on every access. |

When a decision genuinely isn't covered by a rule above, don't invent a pattern silently — flag the ambiguity and
ask, the same discipline this skill's source repo applies to its own skills.
