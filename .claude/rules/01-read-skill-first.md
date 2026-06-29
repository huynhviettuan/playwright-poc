---
description: Always read the relevant skill file before writing or modifying code
globs: ['src/**/*.ts', 'tests/**/*.ts']
---

# Read Skill First

Before creating or modifying any file under `src/` or `tests/`, read the relevant skill from `.claude/skills/`:

| Creating/modifying | Read first                                                 |
| ------------------ | ---------------------------------------------------------- |
| Page object        | `create-page-object.md`                                    |
| Element class      | `create-custom-element.md`                                 |
| API service        | `create-api-service.md`                                    |
| E2E test           | `write-e2e-test.md`                                        |
| API test           | `write-api-test.md`                                        |
| Fixture            | Check existing fixtures in `src/fixtures/` for the pattern |

If no skill exists for your task, follow the closest existing pattern in the codebase. Do not invent new patterns.
