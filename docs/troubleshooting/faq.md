# Frequently Asked Questions

## General

**Q: Why use custom fixtures instead of Playwright default?**
A: Custom fixtures provide type-safe access to page objects, services, and custom expect matchers. See ADR-002 for details.

**Q: Why container-based page objects?**
A: Mirrors frontend structure, better maintainability, follows SOLID principles. See ADR-001.

**Q: Can I use regular Playwright imports?**
A: No. Always import from `@fixtures/fixtures`. Add ESLint rule to enforce this.

## Path Aliases

**Q: Path aliases not working in IDE?**
A: Restart IDE after updating `tsconfig.json`. Ensure your IDE supports TypeScript path mapping.

**Q: Can I use relative imports?**
A: No. Always use path aliases for consistency and easier refactoring.

## Architecture

**Q: When to create a new container vs using existing?**
A: Create new container when page has distinct Header/Main/Footer sections. Simple pages can skip containers.

**Q: Should I create containers for every page?**
A: No (YAGNI). Only for pages with multiple sections or reusable components.

**Q: When to extract helper classes?**
A: When element has complex logic (like DatePicker navigation). See ADR-003.

## Testing

**Q: How to run specific test?**
A: `npx playwright test tests/e2e/auth/login.spec.ts`

**Q: How to run tests in headed mode?**
A: `npx playwright test --headed`

**Q: Tests are flaky, what to do?**
A: Add explicit waits, check element visibility, use proper selectors, avoid timing dependencies.

## Components

**Q: When to use Form component?**
A: Always, when container has form elements. Provides caching and consistent API.

**Q: When to use Table component?**
A: When displaying tabular data. Provides helper methods for row/column operations.

**Q: How to create custom component?**
A: Extend pattern from Form/Table/Modal components. See examples folder.

## Best Practices

**Q: What principles should I follow?**
A: SOLID, YAGNI, KISS, DRY. See ADR-004 for details.

**Q: How to name elements?**
A: Use prefixes: `btn` (button), `txt` (input), `lbl` (label), `tbl` (table).

**Q: Where to put test data?**
A: Use `DataGenerator` for random data, `src/data/` for static test data.
