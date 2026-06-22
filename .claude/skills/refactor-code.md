# Skill: Refactor Code

## When to Use

Use this skill when **changing code structure while preserving behavior**. Typical examples:

-   Extracting a function, class, or component from a too-large body
-   Renaming or moving files for clearer organization
-   Pulling duplicate logic up into a base class or helper
-   Replacing an inline pattern with an existing reusable component
-   Splitting a multi-concern file into focused ones
-   Consolidating divergent implementations into one source of truth

This skill is **repo-agnostic** — the methodology applies anywhere. A "Project-Specific
Patterns" section at the bottom captures playwright-poc shortcuts; substitute your own
for other repos.

## When NOT to Use

| Situation                                                       | Use instead                                  |
| --------------------------------------------------------------- | -------------------------------------------- |
| You're also changing what the code does                         | Do the feature first; refactor in a separate commit |
| There are no tests covering the code you're changing            | Add a smoke test first (see Step 2)          |
| You're rewriting from scratch                                   | That's a rewrite, not a refactor — different planning |
| You're chasing a hypothetical future need                       | YAGNI — wait for the real need               |
| You're "just cleaning up" without a stated goal                 | Stop. Write the goal first (Step 1)          |

## Workflow Overview

```
1. Define the goal              → one sentence: what becomes better, how?
2. Establish a safety net       → existing tests + smoke test + green type-check
3. Plan smallest steps          → series of behavior-preserving changes
4. Execute one step at a time   → change → verify → commit
5. Verify final state           → all checks pass; behavior unchanged
6. Communicate the change       → clean commit + PR explaining the WHY
```

## Step 1: Define the Goal

Write **one sentence** stating what gets better and how. If you can't, you're not ready.

| Good goal                                                                          | Why it's good                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------- |
| "Move request/response types to `@models/` so consumers don't import service impls" | Concrete, measurable, single concern         |
| "Extract calendar navigation from `DatePicker` so it can be unit-tested in isolation" | Names the smell + the structural target      |
| "Consolidate per-page `Toast` instances into one `notification` fixture"           | Names the duplication + the target           |

| Bad goal                                            | Why it fails                                          |
| --------------------------------------------------- | ----------------------------------------------------- |
| "Clean up the services folder"                      | No measurable end state                               |
| "Make it more SOLID"                                | SOLID isn't a destination — pick one principle, apply it |
| "Refactor for future scalability"                   | YAGNI; refactor when the future arrives               |

## Step 2: Establish a Safety Net

Before touching code, verify you can **detect a behavior change**.

### Checklist
-   [ ] Type checker passes (`npx tsc --noEmit` or equivalent)
-   [ ] Linter passes
-   [ ] Existing tests pass — run them once and note the result
-   [ ] Smoke test exists for the contract you're preserving — if not, **write one first**
-   [ ] Working tree is clean — commit any unrelated changes first

If the area you're refactoring has no test, write a smoke test that locks in the
*observable* behavior (inputs → outputs, side effects). The refactor's success
criterion is that this test still passes at the end without any of its expectations
being changed.

> If you can't write a smoke test because the code's behavior is unclear, the
> refactor isn't safe yet. Document the current behavior first.

## Step 3: Plan Smallest Steps

Break the change into a sequence where **each step preserves behavior and can stand alone in a commit**.

Anti-patterns:

| ❌ Bundled change                                            | ✅ Sequence                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| "Rename `Toast` → `Notification`, expand API, add fixture, retrofit specs" — one commit | (1) Rename file via `git mv`, (2) rename class, (3) expand API, (4) create fixture, (5) retrofit specs, (6) delete old usages |
| "Extract helper + simplify caller + add tests + fix bug"     | (1) Extract helper, (2) simplify caller, (3) add tests, (4) fix bug as separate commit |

Each step in the sequence should answer **yes** to all three:
-   Could I ship this commit alone safely?
-   Does the type-check still pass?
-   Does the smoke test still pass?

If a step doesn't pass these, split it further.

## Step 4: Execute — One Step at a Time

For each planned step:

1. **Make the change.** Prefer existing tooling: IDE rename, `git mv` for files (preserves history), `Edit` for surgical changes.
2. **Type-check.** Fix any compiler errors before moving on. Compiler errors during a refactor mean either (a) the change broke something you didn't expect, or (b) you have to also update callers — do that now.
3. **Run the smoke test** (or full tests for risky changes). Fix or revert if it fails.
4. **Commit.** Short message naming the single change.

**When something unexpected fails:**
-   Don't push through "just to see what breaks" — revert, plan smaller, retry.
-   If the safety net catches a behavior change, the refactor was actually a feature change in disguise. Step back, isolate the behavior change as its own commit (separately reviewed), then resume the structural change.

### Concrete examples from this repo

| Refactor                                            | What worked                                                        | What didn't                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Types moved to `@models/auth/`                      | Small steps; `git mv`; tsc after each; 4 files touched in sequence | n/a                                                               |
| `Toast` → `Notification` + fixture                  | `git mv` preserved history; one file overwritten per step          | An external watcher kept reverting a spec file; had to recreate via heredoc |
| `BrowserInstance` ALS refactor                      | Wrote a smoke test FIRST locking the contract                      | The refactor failed (Playwright's `use()` boundary breaks ALS) — but the safety net caught it immediately; clean revert |

The ALS attempt is the prototype of "smoke test first, revert cleanly when it doesn't pan out." Without that smoke test, the broken change might have landed.

## Step 5: Verify Final State

Run the full safety net one more time:

-   [ ] Type-check clean
-   [ ] Lint clean
-   [ ] Smoke test green
-   [ ] Existing tests green
-   [ ] Manual sanity check on any path the smoke test doesn't cover

State explicitly: **the refactor achieved the goal from Step 1**. If it didn't, the
refactor isn't done — or the goal needs revising.

## Step 6: Communicate the Change

### Commit messages

One concern per commit. Lead with the verb:

```
refactor: move SignInRequest/SignInResponse to @models/auth/

Aligns with the established convention (elements, mail, requests all live in
@models/). Service consumers can now import types without pulling in service
implementations.
```

Avoid:
-   "refactor: cleanup" (no concern named)
-   "refactor: a bunch of stuff" (split it)
-   "Refactored services folder" (passive, no why)

### PR description

Cover:
-   **What** changed structurally (file moves, extracts, renames)
-   **Why** — the goal from Step 1, in plain language
-   **How verified** — which smoke tests / type-checks / runs passed
-   **What didn't change** — explicitly call out preserved behavior
-   **Follow-ups deliberately not done** — note them so reviewers don't ask

## Common Refactoring Patterns (Repo-Agnostic)

| Pattern                          | When                                                       | Smallest first step                                |
| -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| **Extract function**             | A block has a clear single purpose with a name             | Pull it out with the same params, leave call site identical |
| **Extract class**                | A function set + state belongs together                    | Move them into a new class file; instantiate at call site |
| **Inline**                       | An abstraction adds noise without value                    | Replace one call site at a time; delete the abstraction last |
| **Rename**                       | The name misleads or no longer fits                        | IDE rename or `git mv`; one file at a time         |
| **Move file**                    | File is in the wrong place                                 | `git mv` preserves history; fix imports next       |
| **Pull up to base class**        | Two subclasses repeat the same method                      | Move to base; delete from subclasses one at a time |
| **Replace conditional with polymorphism** | `if (type === ...)` ladder over a type/role          | Introduce a strategy interface; migrate branches one by one |
| **Decompose conditional**        | Complex condition is hard to read                          | Extract named predicate functions; condition becomes prose |
| **Replace magic value**          | Literal repeated across files                              | Add named constant; replace usages one file at a time |
| **Consolidate duplicate logic**  | Same code in 3+ places                                     | Extract to helper; replace one site at a time      |

## Project-Specific Patterns (playwright-poc)

| Refactor target                                                | Recipe                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Types declared next to a service class                         | Move to `src/models/<module>/<module>.interface.ts`. See [create-api-service](./create-api-service.md). |
| Service methods take `token` as first param                    | Remove `token` param; use `service.setToken(token)` once. See controller pattern in [create-api-service](./create-api-service.md). |
| Service uses `this.get()`/`this.post()` (untyped)             | Replace with `this.send<T>(method, args)` returning `ServiceResponse<T>`. |
| Service uses `createEndpoint('/sub')`                          | Replace with `this.endpoint('/sub')`.                                     |
| Per-page `Toast` properties                                    | Remove; use `notification` fixture from [`docs/guidance/notifications.md`](../../docs/guidance/notifications.md). |
| Inline `BrowserInstance.currentPage` reads from helpers        | Pass `Locator` explicitly (parent scoping); avoid hidden global state.   |
| Login via UI in every spec                                     | Adopt [`use-auth-state`](./use-auth-state.md) + `storageState`.          |
| Inline `page.route(...)` calls scattered across specs          | Extract via [`mock-network`](./mock-network.md) helper class + fixtures. |
| Repeated factory-and-cleanup boilerplate in tests              | Convert to auto-cleanup fixture per [`manage-test-data`](./manage-test-data.md). |
| Page-global `$getByTestId(...)` element lookups                | Re-scope through parent `Locator` per [`create-page-object`](./create-page-object.md). |
| Elements located without `id` when `id` attribute is available | Add `id` option — all elements support `{ id: 'element-id' }`.          |
| Skill / guidance docs that contradict the code                 | Update the doc OR the code so they match; don't leave drift.             |

## Critical Rules

-   ✅ **Behavior-preserving.** A refactor that changes outputs is a feature change in disguise.
-   ✅ **Safety net before code.** Smoke test, type-check, tests — all green before you start, all green after each step.
-   ✅ **Smallest reversible step.** Each commit should be safe to land or revert alone.
-   ✅ **Use `git mv`** for file renames so history follows the file.
-   ✅ **State the goal up front.** Refactors without a goal turn into yak-shaving.
-   ✅ **Revert without sentiment** when an experiment doesn't pan out. The safety net is *for* this.
-   ❌ **Never mix refactor + feature** in one commit. Reviewers can't tell behavior changes from structural ones.
-   ❌ **Never refactor without tests.** Write a smoke test first, then refactor.
-   ❌ **Never speculatively abstract.** YAGNI applies — extract when the third caller appears, not the first.
-   ❌ **Never bypass safety hooks** (`--no-verify`, disabling lint) to "make it green" during a refactor.

## Adapting to Other Repos

The methodology (Steps 1-6) is universal. To use this skill outside playwright-poc:

1.  **Substitute the safety-net tools.** Replace `npx tsc --noEmit` with the type-check or build command your stack uses (`mypy`, `cargo check`, `mix dialyzer`, etc.). Replace `npm test` with the right test runner.
2.  **Substitute the conventions.** The "Project-Specific Patterns" table reflects this repo's choices (`@models/`, fixtures, container-based page objects). For another repo, replace this table with the patterns that team uses.
3.  **Honor the destination repo's skills/docs.** If the target repo has its own `.claude/skills/` or contributing guide, read those first — the per-repo conventions trump this skill's defaults.
4.  **Keep everything else.** The "When NOT to use," "Common Patterns," and "Critical Rules" sections are repo-agnostic and apply unchanged.

## Related Documentation

-   [`create-custom-element.md`](./create-custom-element.md) — extracting helper classes (SOLID composition pattern shown there)
-   [`create-api-service.md`](./create-api-service.md) — the "types in `@models`" rule that motivates the most common refactor in this repo
-   [`docs/decisions/`](../../docs/decisions/) — ADRs that document why certain structures exist; read before refactoring across them
-   [`docs/troubleshooting/common-errors.md`](../../docs/troubleshooting/common-errors.md) — flaky-test patterns; some refactors exist to eliminate these
