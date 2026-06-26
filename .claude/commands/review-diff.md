---
description: Review the current diff against framework skills & conventions
argument-hint: (optional path to focus on)
---

Read `.claude/skills/code-review.md`, then review the current working changes $ARGUMENTS.

Focus on this repo's non-negotiables:

-   Imports come from `@fixtures/fixtures`, never `@playwright/test`.
-   Locators are parent-scoped (no page-global `getByTestId`).
-   `Form` component used where containers have form inputs.
-   Messages read via the `notification` fixture, not per-page toast/error elements.
-   Path aliases used instead of relative imports.
-   SOLID / YAGNI / KISS / DRY; logic lives in page objects, not test files.

Report findings grouped by severity, each with a file:line reference and a concrete fix.
