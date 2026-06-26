---
description: Scaffold a container-based page object for a screen
argument-hint: <feature/screen name> [url]
---

Read `.claude/skills/create-page-object.md`, then create a container-based page object for: **$ARGUMENTS**

Requirements:

-   Use Header / Main / Footer containers as appropriate.
-   Parent-scoped locators only — never page-global `getByTestId`.
-   Use a `Form` component where the screen has form inputs.
-   Read error/success messages via the `notification` fixture (don't add per-page toast/error elements).
-   Use path aliases (`@pages/*`, `@elements/*`, ...), never relative imports.
-   Register the new page object in `src/fixtures/fixtures.ts`.

If a URL was provided, first read `.claude/skills/explore-screens.md` and explore it to capture real locators before
writing the page object.
