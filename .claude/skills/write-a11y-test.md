# Skill: Write Accessibility Test

## When to Use

Use this skill when writing accessibility (a11y) tests for any page or component.

## When NOT to Use

| Situation                              | Use instead             |
| -------------------------------------- | ----------------------- |
| Testing user flows (login, CRUD, etc.) | `write-e2e-test.md`     |
| Testing API endpoints                  | `write-api-test.md`     |
| Visual regression / screenshot testing | (future visual skill)   |
| Building a page object                 | `create-page-object.md` |

## Critical Rules

### ✅ ALWAYS Use Custom Fixtures

```ts
import { expect, test } from '@fixtures/fixtures';
// ❌ NEVER: import { expect, test } from '@playwright/test';
```

### ✅ Use the `a11y` Fixture

The `a11y` fixture provides an `AccessibilityHelper` instance with built-in scan, filter, and report utilities.

```ts
test('page should have no critical violations', async ({ a11y }) => {
    const results = await a11y.scan();
    const critical = AccessibilityHelper.filterByImpact(results, 'serious');
    expect(critical).toHaveLength(0);
});
```

### ✅ Import AccessibilityHelper for Static Methods

```ts
import { AccessibilityHelper } from '@helpers/accessibility.helper';
```

## Architecture

```
src/
├── models/accessibility/
│   └── accessibility.interface.ts    # A11yScanOptions, A11yViolation types
├── helpers/
│   └── accessibility.helper.ts       # AccessibilityHelper (scan, filter, report)
├── fixtures/
│   └── accessibility-fixtures.ts     # a11y fixture + a11yOptions override
tests/
└── e2e/accessibility/                # A11y test specs
```

## Instructions

### 1. Create Test File

Place in `tests/e2e/accessibility/[page-name]-a11y.spec.ts`:

```ts
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';
import { AccessibilityHelper } from '@helpers/accessibility.helper';

test.describe('[Page Name] — Accessibility', () => {
    test.beforeEach(async ({ goto }) => {
        await goto(Endpoints.someFeature.somePage);
    });

    test('TC-XX-A11Y-001 — should have no critical violations', async ({ a11y }) => {
        const results = await a11y.scan();
        const critical = AccessibilityHelper.filterByImpact(results, 'serious');
        expect(critical).toHaveLength(0);
    });
});
```

### 2. Scan Options

#### Full page scan (default)

```ts
const results = await a11y.scan();
```

#### WCAG 2.1 AA compliance

```ts
const results = await a11y.scan({ includeTags: ['wcag21aa', 'wcag2aa'] });
expect(results.violations).toHaveLength(0);
```

#### Scoped to a section

```ts
const results = await a11y.scan({ include: ['[data-testid="login-form"]'] });
```

#### Exclude third-party widgets

```ts
const results = await a11y.scan({ exclude: ['.third-party-widget', 'iframe'] });
```

#### Disable specific rules

```ts
const results = await a11y.scan({
    rules: [{ id: 'color-contrast', enabled: false }]
});
```

### 3. Filtering Results

Filter violations by impact level (`minor` | `moderate` | `serious` | `critical`):

```ts
// Only fail on serious + critical
const serious = AccessibilityHelper.filterByImpact(results, 'serious');
expect(serious).toHaveLength(0);

// Structured violation objects
const violations = AccessibilityHelper.formatViolations(results);
// → [{ id, impact, description, helpUrl, nodes }]
```

### 4. Debugging Failures

Generate a human-readable report:

```ts
const results = await a11y.scan();
if (results.violations.length > 0) {
    console.log(AccessibilityHelper.buildReport(results));
}
expect(results.violations).toHaveLength(0);
```

Output format:

```
3 violation(s) found:

[SERIOUS] color-contrast: Elements must have sufficient color contrast (2 instances)
[MODERATE] label: Form elements must have labels (1 instance)
[MINOR] region: All page content should be contained by landmarks (1 instance)
```

### 5. Override Default Options Per File

Use `a11yOptions` to set defaults for all tests in a describe block:

```ts
test.use({
    a11yOptions: {
        includeTags: ['wcag21aa'],
        exclude: ['.cookie-banner']
    }
});

test.describe('Dashboard — WCAG 2.1 AA', () => {
    test('should pass', async ({ a11y }) => {
        // inherits the options above
        const results = await a11y.scan();
        expect(results.violations).toHaveLength(0);
    });
});
```

## Test Patterns

### Pattern 1: Full Page Audit

Test the page in its default state. Every page should have this as a baseline.

```ts
test('should have no critical violations', async ({ a11y }) => {
    const results = await a11y.scan();
    const critical = AccessibilityHelper.filterByImpact(results, 'serious');
    expect(critical).toHaveLength(0);
});
```

### Pattern 2: After User Interaction

Test that error states, modals, and dynamic content remain accessible.

```ts
test('error state should remain accessible', async ({ signInPage, a11y }) => {
    await signInPage.main.btnLogin.click();
    await BrowserInstance.currentPage.waitForTimeout(500);

    const results = await a11y.scan();
    const critical = AccessibilityHelper.filterByImpact(results, 'serious');
    expect(critical).toHaveLength(0);
});
```

### Pattern 3: Scoped Component Check

Test a specific section in isolation.

```ts
test('navigation should be accessible', async ({ a11y }) => {
    const results = await a11y.scan({ include: ['nav'] });
    expect(results.violations).toHaveLength(0);
});
```

### Pattern 4: WCAG Compliance Level

Test against a specific WCAG standard.

```ts
test('should meet WCAG 2.1 AA', async ({ a11y }) => {
    const results = await a11y.scan({ includeTags: ['wcag21aa', 'wcag2aa'] });
    expect(results.violations).toHaveLength(0);
});
```

## Common WCAG Tag Reference

| Tag             | Standard           | Level |
| --------------- | ------------------ | ----- |
| `wcag2a`        | WCAG 2.0           | A     |
| `wcag2aa`       | WCAG 2.0           | AA    |
| `wcag2aaa`      | WCAG 2.0           | AAA   |
| `wcag21a`       | WCAG 2.1           | A     |
| `wcag21aa`      | WCAG 2.1           | AA    |
| `wcag22aa`      | WCAG 2.2           | AA    |
| `best-practice` | axe best practices | —     |

## Test Naming Convention

```
TC-[FEATURE]-A11Y-[NNN] — [description]
```

Examples:

-   `TC-SI-A11Y-001 — sign in page should have no critical violations`
-   `TC-DASH-A11Y-001 — dashboard should meet WCAG 2.1 AA`
-   `TC-MODAL-A11Y-001 — confirmation modal should be accessible`

## Checklist

-   [ ] Test file in `tests/e2e/accessibility/[page]-a11y.spec.ts`
-   [ ] Uses `a11y` fixture from `@fixtures/fixtures`
-   [ ] Imports `AccessibilityHelper` from `@helpers/accessibility.helper`
-   [ ] Baseline full-page scan with `filterByImpact('serious')`
-   [ ] WCAG level tested if compliance is required
-   [ ] Error / interactive states tested separately
-   [ ] Third-party widgets excluded if not under your control
-   [ ] Test names follow `TC-XX-A11Y-NNN` convention
