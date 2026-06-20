# ADR-002: Custom Fixtures over Playwright Default

## Status
Accepted

## Date
2026-06-18

## Context
Tests need access to page objects, services, and custom expect matchers. Using Playwright's default `test` and `expect` imports doesn't provide these capabilities. We need a way to centralize and extend test functionality.

## Decision
Always import `test` and `expect` from `@fixtures/fixtures` instead of `@playwright/test`:

```typescript
// ✅ Correct
import { test, expect } from '@fixtures/fixtures';

// ❌ Wrong
import { test, expect } from '@playwright/test';
```

All fixtures are merged in `src/fixtures/fixtures.ts` using `mergeTests()` and `mergeExpects()`.

## Consequences

### Positive
- ✅ Centralized test setup and teardown
- ✅ Easy access to page objects and services in tests
- ✅ Custom expect matchers available globally
- ✅ Consistent test structure across the framework

### Negative
- ❌ Developers must remember to import from fixtures
- ❌ IDE auto-import might suggest wrong import

## Implementation

```typescript
// src/fixtures/fixtures.ts
export const test = mergeTests(
    serviceFixtures,
    commandFixtures,
    pageFixtures,
    hookFixtures
);
export const expect = mergeExpects(expectFixtures);
```

> ℹ️ There is **no** `mailFixtures` — `Mail` is instantiated directly (see [work-with-email.md](../../.claude/skills/work-with-email.md)). Add new fixture modules to the `mergeTests()` call only when you create them.

## Alternatives Considered

1. **Use Playwright defaults** - Rejected: No way to inject page objects
2. **Global test setup** - Rejected: Implicit dependencies, hard to track
3. **Custom fixtures** - Accepted: Explicit, type-safe, composable

## References
- `.claude/skills/write-e2e-test.md`
- `.claude/skills/write-api-test.md`
- `src/fixtures/fixtures.ts`
