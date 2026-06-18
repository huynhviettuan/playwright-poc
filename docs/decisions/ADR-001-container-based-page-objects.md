# ADR-001: Container-Based Page Object Architecture

## Status
Accepted

## Date
2026-06-18

## Context
Page objects were becoming monolithic with all elements defined in a single class. Changes to header elements required modifying the entire page object. This violated Single Responsibility Principle and made code harder to maintain.

## Decision
Adopt container-based architecture where:
- Pages are composed of Header, Main, and Footer containers
- Each container is a separate class managing its own section
- Containers are stored in `src/components/containers/[page-name]/`
- Page objects import and compose containers

## Consequences

### Positive
- ✅ SOLID compliance (Single Responsibility, Open/Closed)
- ✅ Better maintainability - changes isolated to containers
- ✅ Reusable containers across multiple pages
- ✅ Mirrors frontend component architecture
- ✅ Easier to test individual sections

### Negative
- ❌ More files to manage (3 files vs 1 per page)
- ❌ Slight increase in initial setup time

## Implementation

```typescript
// Container
export class SignInMainContainer {
    readonly txtEmail: Input;
    readonly btnLogin: Button;
}

// Page Object
export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;
}
```

## Alternatives Considered

1. **Monolithic Page Objects** - Rejected: Poor maintainability
2. **Deep Inheritance Hierarchy** - Rejected: Brittle, hard to change
3. **Container Composition** - Accepted: Flexible, SOLID-compliant

## References
- `.claude/skills/create-page-object.md`
- `src/components/containers/sign-in/`
