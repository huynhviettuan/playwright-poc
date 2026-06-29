# Cascading Dropdown (Multi-Level Menu)

## When to Use

Use `CascadingDropdown` when clicking a menu item opens a **separate floating panel** with sub-items, and this can go
multiple levels deep. If the menu is a flat single-level list, use the regular `Dropdown` instead.

## Setup

```ts
import { CascadingDropdown } from '@elements/common/cascading-dropdown';

// In a page object section
readonly ddNavigation = new CascadingDropdown({
    parentLocator: this.container,
    locator: '[data-testid="nav-menu"]',
    panelLocator: '[role="menu"]' // selector for each floating panel
});
```

### Constructor Options

| Option          | Default               | Description                                |
| --------------- | --------------------- | ------------------------------------------ |
| `parentLocator` | Current page          | Parent scope for the trigger element       |
| `locator`       | `.cascading-dropdown` | CSS selector for the trigger element       |
| `panelLocator`  | `[role="menu"]`       | CSS selector for each popup panel          |
| `id`            | —                     | HTML id of the trigger (overrides locator) |

## Primary API: `selectPath`

Navigate multiple levels by providing the full path as an array:

```ts
// Click trigger → hover "Electronics" → hover "Phones" → click "iPhone"
await page.main.ddCategory.selectPath(['Electronics', 'Phones', 'iPhone']);

// With exact text matching
await page.main.ddCategory.selectPath(['Item A', 'Sub B'], { exact: true });
```

**How it works internally:**

1. Clicks the trigger element to open the first panel
2. For each item except the last: **hovers** the item to open the next panel
3. For the last item: **clicks** it to make the final selection
4. Panels are identified by index — first visible panel = level 1, second = level 2, etc.

## Other Methods

### `selectOption(option)` — Single Level

For simple cases where you only need one level:

```ts
await page.main.ddMenu.selectOption('Settings');
```

### `getOptions()` — List First-Level Items

```ts
const items = await page.main.ddMenu.getOptions();
// ['Dashboard', 'Settings', 'Profile']
```

### `getSubOptions(parentItem)` — List Second-Level Items

```ts
const subItems = await page.main.ddMenu.getSubOptions('Settings');
// ['General', 'Security', 'Notifications']
```

## Configuring `panelLocator`

The `panelLocator` must match **all** popup panels at any level. The element uses `:visible` and `.nth(index)` to
distinguish between levels.

Common patterns:

| Framework   | panelLocator                            |
| ----------- | --------------------------------------- |
| Material UI | `[role="menu"]`                         |
| Ant Design  | `.ant-dropdown`                         |
| Bootstrap   | `.dropdown-menu`                        |
| Custom      | `.popup-panel` (whatever your app uses) |

## Hover vs Click to Open Submenus

By default, `selectPath` **hovers** intermediate items to open child panels. If your app requires **clicking** to open
submenus, you can call `selectPath` where each intermediate item is a "click + wait" — or extend the class to add a
`clickToOpen` option.

## Related

-   [Dropdown](../../src/elements/common/dropdown.ts) — single-level dropdown
-   [create-custom-element skill](../../.claude/skills/create-custom-element.md) — how to extend elements
