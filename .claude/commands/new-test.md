---
description: Write a behavior-style E2E test for a scenario
argument-hint: <scenario to test>
---

Read `docs/guidance/behavior-testing.md` and `.claude/skills/write-behavior-test.md`, then write a behavior-style spec
for: **$ARGUMENTS**

Requirements:

-   Import `test`/`expect` from `@fixtures/fixtures` (never `@playwright/test`).
-   Narrate with the `given/when/then` DSL from `@behavior/bdd`; each step body delegates to a page object.
-   Tag the test with the acceptance-criteria id (`@AC-<id>`) when one exists in `docs/user-stories/`.
-   Keep logic in page objects; follow Arrange-Act-Assert.
-   Use the `notification` fixture and `NotificationMessages` constants for messages.

If the scenario is purely technical (no business sign-off value), use `.claude/skills/write-e2e-test.md` and write a
plain E2E spec instead.
