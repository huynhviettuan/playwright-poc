---
description: Turn a user story into manual test cases
argument-hint: <feature name>
---

Read `.claude/skills/generate-test-cases.md`, then read `docs/user-stories/$ARGUMENTS.md` and produce
`docs/test-cases/$ARGUMENTS.md`.

Requirements:

-   Trace each test case back to its acceptance-criteria id from the user story.
-   Cover happy paths, negative paths, and edge cases.
-   If the feature has a live screen, delegate to `.claude/skills/explore-screens.md` to ground cases in real UI/API
    behavior before writing them.
