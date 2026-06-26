# Architecture Decision Records (ADRs)

This folder contains Architecture Decision Records documenting important architectural and design decisions.

## Purpose

**Read before changing patterns** to understand:

-   Why certain patterns were chosen
-   Context and constraints at decision time
-   Consequences and trade-offs
-   Alternatives considered

## ADR Format

Use this template for new ADRs:

```markdown
# ADR-XXX: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Context

What is the issue we're facing?

## Decision

What decision have we made?

## Consequences

What are the positive and negative consequences?

## Alternatives Considered

What other options did we evaluate?
```

## Example

```markdown
# ADR-001: Container-Based Page Object Architecture

## Status

Accepted

## Context

Page objects were becoming monolithic and hard to maintain. Changes to one section of a page required modifying the
entire page object class.

## Decision

Adopt container-based architecture where pages are composed of Header, Main, and Footer containers. Each container
manages its own section.

## Consequences

**Positive:**

-   Better separation of concerns (SOLID)
-   Easier to maintain and test
-   Reusable containers across pages
-   Mirrors frontend component structure

**Negative:**

-   More files to manage
-   Slight increase in initial setup time

## Alternatives Considered

1. Keep monolithic page objects
2. Use inheritance hierarchy
3. Component composition (chosen)
```

## Current ADRs

-   ADR-001: Container-Based Page Object Architecture
-   ADR-002: Custom Fixtures over Playwright Default
-   ADR-003: SOLID Principles for Complex Elements
-   ADR-004: YAGNI, KISS, DRY Coding Principles
-   ADR-005: BrowserInstance Static Singleton
-   ADR-006: Observer Pattern for CI Notifications

## Guidelines

-   Number ADRs sequentially
-   Keep ADRs immutable - create new ADRs to supersede old ones
-   Reference ADR numbers in code comments for important decisions
-   Review ADRs before making architectural changes
