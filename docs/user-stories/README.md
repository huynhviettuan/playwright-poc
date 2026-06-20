# User Stories

Source-of-truth user stories that feed the [`generate-test-cases`](../../.claude/skills/generate-test-cases.md) skill. One file per feature.

## Purpose

A user story documents **what** the feature should do, from the user's perspective, with testable acceptance criteria. The [`generate-test-cases`](../../.claude/skills/generate-test-cases.md) skill reads a story, extracts acceptance criteria (AC-1, AC-2, …), then produces the matching [`docs/test-cases/<feature>.md`](../test-cases/) where every test case is traceable back to an AC.

## File format

Each file should include:

| Section                         | Required | Purpose                                              |
| ------------------------------- | -------- | ---------------------------------------------------- |
| **Title (`# <Feature>`)**       | ✅       | Short noun phrase                                    |
| **Status / Last updated**       | ✅       | Draft / Accepted / Implemented + date                |
| **Story (As-a / I-want / So-that)** | ✅   | Standard user-story sentence                         |
| **Acceptance Criteria**         | ✅       | Numbered AC-1, AC-2, …; each must be testable        |
| **Business Rules**              | optional | Constraints not in ACs (rate limits, retention, …)   |
| **Out of Scope**                | optional | Explicitly excluded behaviors                        |
| **References**                  | optional | Links to designs, related stories, prior ADRs        |

Avoid mixing implementation details into a user story — keep it about behavior the user observes. Tech notes belong in [decisions/](../decisions/) (ADRs) or [guidance/](../guidance/).

## Current stories

- [`sign-in.md`](./sign-in.md) — Sign In (Authentication)

## Workflow

```
1. Write the user story here.
2. Run `generate-test-cases` against it.
3. Generated test cases land in docs/test-cases/<feature>.md, with each case
   citing the AC it covers.
4. Automation specs reference the TC IDs, closing the trace:
   user story → AC → test case → automated spec.
```
