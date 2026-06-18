# Skill: Create Custom Element

## When to Use
Use this skill when creating a new reusable UI element component.

## Critical Rules

### ✅ Follow SOLID Principles
- **Single Responsibility**: One element class per UI component type
- **Open/Closed**: Extend base classes, never modify them
- **Liskov Substitution**: Custom elements work wherever base elements work
- **Composition**: Use helper classes for complex logic

### ✅ Clean Code Practices
- Extract complex logic into helper classes (e.g., `CalendarNavigation`, `CalendarParser`)
- Use static methods for pure utility functions
- Keep constructors focused on initialization only
- Use composition over inheritance for complex behaviors

## Instructions

1. **Determine the base class** to extend:
   - **BaseControl**: Basic elements (visibility, text, attributes)
   - **Clickable**: Clickable elements (buttons, links)
   - **Editable**: Input-like elements (textboxes, textareas)

2. **Create the element class** in `src/elements/common/[element-name].ts`

## Simple Element Example

```ts
import { Clickable } from '@elements/base/clickable';
import { Locator } from '@playwright/test';

export class Link extends Clickable {
    constructor(option?: {
        parentLocator?: Locator;
        label?: string;
        locator?: Locator;
        href?: string;
    }) {
        const locator = option?.locator || 
            option?.parentLocator?.locator(`a[href="${option?.href}"]`);
        super(locator);
    }
    
    async getHref(): Promise<string> {
        return await this.getAttribute('href');
    }
}
```

## Complex Element with SOLID (DatePicker Example)

### Step 1: Extract Helper Classes

```ts
// Single Responsibility: Navigation only
class CalendarNavigation {
    constructor(
        private readonly imgBack: Image,
        private readonly imgNext: Image
    ) {}

    async navigateMonths(target: number, current: number): Promise<void> {
        if (current === target) return;
        
        if (current > target) {
            await this.imgBack.click();
        } else {
            await this.imgNext.click();
        }
    }
}

// Single Responsibility: Parsing only
class CalendarParser {
    static parseDate(dateString: string, format: string) {
        return {
            year: Number(DateTimeHelper.getYear(dateString, format)),
            month: Number(DateTimeHelper.getMonth(dateString, format, 'M')),
            day: Number(DateTimeHelper.getMonth(dateString, format, 'D'))
        };
    }
}
```

### Step 2: Compose Main Element

```ts
export class DatePicker extends Editable {
    private readonly navigation: CalendarNavigation;
    private readonly lblHeader: Label;
    
    constructor(label: string, parentLocator?: Locator) {
        super(parentLocator?.locator('.date-picker', { hasText: label }));
        
        // Composition: Inject navigation behavior
        this.navigation = new CalendarNavigation(
            new Image({ locator: $('.calendar .back') }),
            new Image({ locator: $('.calendar .next') })
        );
        
        this.lblHeader = new Label({ locator: $('.calendar .header') });
    }
    
    async selectDate(dateString: string, format: string): Promise<void> {
        const { year, month, day } = CalendarParser.parseDate(dateString, format);
        
        await this.click(); // Open calendar
        await this.selectMonth(month);
        await this.selectDay(day);
    }
    
    private async selectMonth(target: number): Promise<void> {
        const current = await this.getCurrentMonth();
        await this.navigation.navigateMonths(target, current);
        if (current !== target) await this.selectMonth(target);
    }
}
```

## Base Classes Reference

- **BaseControl**: `isVisible()`, `isDisabled()`, `getTextContent()`, `getAttribute()`, `waitFor()`, `count()`
- **Clickable**: All BaseControl methods + `click()`, `doubleClick()`, `hover()`
- **Editable**: All BaseControl methods + `fill()`, `clear()`, `uploadFile()`

## Benefits of SOLID Approach

### ❌ Bad - Everything in one class
```ts
export class DatePicker {
    async selectYear(target: number) {
        const current = await this.getCurrentYear();
        if (current > target) await this.imgBack.click();
        else await this.imgNext.click();
        // Navigation logic mixed with element
    }
}
```

### ✅ Good - Separated concerns
```ts
// Navigation extracted
class CalendarNavigation {
    async navigateYears(target: number, current: number) { ... }
}

// Element uses composition
export class DatePicker {
    private navigation: CalendarNavigation;
    
    async selectYear(target: number) {
        const current = await this.getCurrentYear();
        await this.navigation.navigateYears(target, current);
    }
}
```
