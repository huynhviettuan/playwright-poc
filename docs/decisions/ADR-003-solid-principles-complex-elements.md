# ADR-003: SOLID Principles for Complex Elements

## Status
Accepted

## Date
2026-06-18

## Context
Complex UI elements like DatePicker contained mixed responsibilities: navigation logic, parsing logic, and UI interaction all in one class. This made the code hard to understand, test, and maintain.

## Decision
Apply SOLID principles by extracting responsibilities into separate helper classes:
- Navigation logic → `CalendarNavigation` class
- Parsing logic → `CalendarParser` class (static methods)
- Element class → Orchestration only

Use composition to combine behaviors instead of inheritance.

## Consequences

### Positive
- ✅ Single Responsibility - each class has one clear purpose
- ✅ Easier to test - can test helpers independently
- ✅ Better maintainability - changes isolated to specific classes
- ✅ Reusable components - helpers can be used elsewhere

### Negative
- ❌ More classes to manage
- ❌ Slightly more complex structure initially

## Implementation

```typescript
// Helper: Navigation logic only
class CalendarNavigation {
    async navigateMonths(target: number, current: number) { ... }
}

// Helper: Parsing logic only (static)
class CalendarParser {
    static parseDate(dateString: string) { ... }
}

// Element: Composition and orchestration
export class DatePicker {
    private readonly navigation: CalendarNavigation;
    
    async selectDate(dateString: string) {
        const { year, month, day } = CalendarParser.parseDate(dateString);
        await this.navigation.navigateMonths(month, currentMonth);
    }
}
```

## Alternatives Considered

1. **Monolithic element class** - Rejected: Violates SRP
2. **Deep inheritance** - Rejected: Brittle and hard to change
3. **Helper classes + Composition** - Accepted: Flexible, testable

## References
- `.claude/skills/create-custom-element.md`
- `src/elements/common/date-picker.ts`
