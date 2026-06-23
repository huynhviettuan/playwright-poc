# ADR-004: YAGNI, KISS, DRY Coding Principles

## Status

Accepted

## Date

2026-06-18

## Context

Without clear coding guidelines, developers may:

-   Over-engineer solutions with unnecessary complexity
-   Build features that aren't needed yet
-   Duplicate code instead of reusing existing functionality
-   Create maintainability issues over time

We need simple, practical principles that guide everyday coding decisions.

## Decision

Apply three core principles to all code:

### YAGNI (You Aren't Gonna Need It)

**Rule:** Don't implement functionality until it's actually required.

**Examples:**

-   ❌ Adding pagination to a list that only shows 3 items
-   ❌ Building a "future-proof" abstraction layer for a simple feature
-   ✅ Implement only what the current requirement specifies
-   ✅ Add complexity when real needs emerge

### KISS (Keep It Simple, Stupid)

**Rule:** Prefer simple, straightforward solutions over complex ones.

**Examples:**

-   ❌ Deep inheritance hierarchies (5+ levels)
-   ❌ Nested ternaries: `a ? b ? c : d : e ? f : g`
-   ✅ Clear if-else blocks with early returns
-   ✅ Flat, readable code structure

### DRY (Don't Repeat Yourself)

**Rule:** Every piece of knowledge should have a single, authoritative source.

**Examples:**

-   ❌ Copy-paste same validation in 10 test files
-   ❌ Duplicate date formatting logic everywhere
-   ✅ Extract to `DateTimeHelper.today()`
-   ✅ Create reusable `Form` component

## Consequences

### Positive

-   ✅ Simpler, more maintainable codebase
-   ✅ Less code to test and debug
-   ✅ Faster development (no over-engineering)
-   ✅ Easier onboarding for new developers

### Negative

-   ❌ Requires discipline to avoid premature optimization
-   ❌ May need refactoring when new requirements emerge
