# Slash Commands

Typed shortcuts for common tasks in this repo. Type `/<name> <args>` in Claude Code; each command expands to a prompt
that reads the relevant [skill](../skills/README.md) and applies the framework's conventions.

Commands are intentionally **thin** — they delegate to skills, which remain the single source of truth. Update the
skill, not the command, when a pattern changes.

## Available commands

| Command         | Does                                              | Delegates to skill                |
| --------------- | ------------------------------------------------- | --------------------------------- |
| `/new-page`     | Scaffold a container-based page object             | `create-page-object` (+ `explore-screens` if a URL is given) |
| `/new-test`     | Write a behavior-style E2E test                    | `write-behavior-test` (or `write-e2e-test`) |
| `/new-service`  | Create an API service extending `BaseService`      | `create-api-service` (+ `create-service-from-swagger`) |
| `/test-cases`   | Turn a user story into manual test cases           | `generate-test-cases`             |
| `/review-diff`  | Review the current diff against skills/conventions | `code-review`                     |
| `/gen-diagram`  | Generate a flat SVG (+PNG) architecture diagram    | — (built-in prompt template)      |

## Examples

```
/new-page Reset Password https://app.example.com/reset
/new-test User cannot sign in with an unverified email
/new-service Invoices ./docs/swagger/invoices.json
/test-cases sign-in
/review-diff src/pages
/gen-diagram the auth token refresh flow between client, API, and identity service
```

## Adding a command

Create `<name>.md` here with frontmatter and a prompt body:

```markdown
---
description: One-line summary shown in the command list
argument-hint: <what to type after the command>
---

Read `.claude/skills/<relevant-skill>.md`, then <do the thing with> **$ARGUMENTS**.

- State the high-risk non-negotiables (custom fixtures, parent-scoped locators, path aliases).
```

Use `$ARGUMENTS` for everything after the command, or `$1`, `$2` for positional args. Keep the body short and point at a
skill rather than restating it. See the [prompt library](../../docs/guidance/prompts.md) for prompt-writing tips.
