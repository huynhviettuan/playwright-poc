---
description: Always register new artifacts in fixtures, registry docs, and indexes
globs: ['src/**/*.ts']
---

# Register Everything

When creating new artifacts, always complete the full registration:

| New artifact | Register in                                                      |
| ------------ | ---------------------------------------------------------------- |
| Page object  | `src/fixtures/page-fixtures.ts` + `docs/registry/pages.md`       |
| Service      | `src/fixtures/service-fixtures.ts` + `docs/registry/services.md` |
| Element      | `docs/registry/elements.md`                                      |
| Helper       | `docs/registry/helpers.md`                                       |
| Fixture file | `src/fixtures/fixtures.ts` (add to `mergeTests()`)               |
| Guidance doc | `docs/guidance/README.md`                                        |

Unregistered code is invisible to the rest of the framework. A fixture that isn't merged into `fixtures.ts` cannot be
used in tests.
