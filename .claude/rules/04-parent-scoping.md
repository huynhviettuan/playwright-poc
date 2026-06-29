---
description: Every element must resolve through a parent Locator, never page-globally
globs: ['src/pages/**/*.ts', 'src/components/**/*.ts']
---

# Parent Scoping

Every element MUST resolve through a parent `Locator` (container, section, or component). Never use page-global
selectors.

```ts
// ✅ Correct — scoped through container
this.btnSubmit = new Button({ parentLocator: this.container, locator: '[data-testid="submit"]' });

// ❌ Wrong — page-global, will match duplicates in modals/tabs
this.btnSubmit = new Button({ locator: '[data-testid="submit"]' });
```

The same `data-testid` can appear in modals, hidden tabs, or prerendered routes. Page-global locators are flakiness
sources.
