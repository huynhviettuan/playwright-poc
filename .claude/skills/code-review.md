# Skill: Code Review

## When to Use

Use this skill when reviewing code changes (PRs, diffs, or files) in this project — whether reviewing someone else's
work or self-reviewing before committing.

## When NOT to Use

| Situation                                      | Use instead                                              |
| ---------------------------------------------- | -------------------------------------------------------- |
| You're writing new code                        | Use the relevant creation skill (page object, test, etc) |
| You're refactoring existing code               | `refactor-code.md` or `refactor-code-follow-skills.md`   |
| You're only checking if tests pass             | Run the test suite directly                              |
| You're reviewing architecture/design decisions | Check `docs/decisions/` ADRs                             |

## Review Checklist

Work through each section in order. Flag violations with severity:

-   🔴 **Block** — must fix before merge
-   🟡 **Warn** — should fix, but not a blocker
-   🟢 **Nit** — suggestion for improvement

---

### 1. Framework Patterns (project-specific)

These are non-negotiable rules from the skills and ADRs.

#### Imports

-   [ ] `test` and `expect` imported from `@fixtures/fixtures`, never from `@playwright/test` → 🔴
-   [ ] All imports use path aliases (`@pages/*`, `@elements/*`, etc.), no relative imports → 🔴
-   [ ] No unused imports → 🟡

#### Parent Scoping

-   [ ] Every element resolves through a parent `Locator`, not page-global `$getByTestId(...)` → 🔴
-   [ ] Same `data-testid` can appear in modals, hidden tabs, prerendered routes — locator must be unambiguous → 🔴

#### Form Component

-   [ ] Containers with form elements use `new Form(this.container)` + `form.getInput()` / `form.getButton()` → 🔴
-   [ ] No page-global input wiring → 🔴

#### Notification Fixture

-   [ ] Error/success messages use the centralized `notification` fixture → 🔴
-   [ ] No per-page `toast` properties or `lblError` elements that duplicate notification → 🔴
-   [ ] Messages reference `NotificationMessages` constants, not hardcoded strings → 🟡

#### Page Objects

-   [ ] Container-based architecture (Header / Main / Footer) → 🔴
-   [ ] Containers in `src/components/containers/[page-name]/` → 🟡
-   [ ] Constructor only initializes elements, no business logic → 🟡
-   [ ] Elements use correct element classes (`Button`, `Input`, `Dropdown`, etc.) → 🔴
-   [ ] Element naming follows convention: `btn`, `txt`, `lbl`, `lnk`, `ddl`, `chk` prefixes → 🟡

#### Services

-   [ ] Services extend `BaseService` → 🔴
-   [ ] Endpoint URLs use `Endpoints` constants → 🔴
-   [ ] Request/response types defined in `@models/` → 🟡

#### Fixtures

-   [ ] New page objects and services registered in `src/fixtures/fixtures.ts` → 🔴
-   [ ] Fixtures use `mergeTests()` / `mergeExpects()` pattern → 🔴

---

### 2. Clean Code & SOLID

#### Single Responsibility

-   [ ] Each file/class has one reason to change → 🟡
-   [ ] Test files contain test logic only, page interaction logic lives in page objects → 🔴
-   [ ] No god objects or classes doing too many things → 🟡

#### DRY

-   [ ] No duplicated locators across files → 🟡
-   [ ] Repeated logic extracted into helpers or base classes → 🟡
-   [ ] Shared test setup extracted into `beforeEach` or fixtures → 🟡

#### YAGNI / KISS

-   [ ] No unused parameters, methods, or classes → 🟡
-   [ ] No premature abstractions or over-engineering → 🟡
-   [ ] No code written for hypothetical future requirements → 🟡

#### Naming

-   [ ] Class names are descriptive and match their file name → 🟡
-   [ ] Method names describe what they do (verb + noun) → 🟡
-   [ ] No magic numbers or hardcoded strings — use constants → 🟡
-   [ ] Boolean variables/methods use `is`, `has`, `should` prefixes → 🟢

#### Complexity

-   [ ] No deep nesting (max 2-3 levels) → 🟡
-   [ ] Functions are small and focused → 🟡
-   [ ] No long parameter lists — use objects if > 3 params → 🟢

---

### 3. Test Quality

#### Structure

-   [ ] Tests follow Arrange-Act-Assert pattern → 🟡
-   [ ] Tests are independent — no shared mutable state between tests → 🔴
-   [ ] `test.describe` groups related tests logically → 🟢
-   [ ] Test names describe the expected behavior, not the implementation → 🟡

#### Assertions

-   [ ] Assertions are specific (not just `toBeTruthy()` when a better matcher exists) → 🟡
-   [ ] Custom expect matchers used where available (check `docs/guidance/expect.md`) → 🟡
-   [ ] No assertions on implementation details — assert on user-visible behavior → 🟡

#### Reliability

-   [ ] No hardcoded waits (`page.waitForTimeout`) — use Playwright auto-wait or explicit conditions → 🔴
-   [ ] No flaky locators (nth-child on dynamic lists, text that changes with locale) → 🔴
-   [ ] Test data is isolated — created in test, cleaned up after → 🟡
-   [ ] No dependency on test execution order → 🔴

---

### 4. Bug Detection

-   [ ] No logic errors (wrong operator, off-by-one, swapped arguments) → 🔴
-   [ ] No missing `await` on async operations → 🔴
-   [ ] No unhandled promise rejections or missing error handling at system boundaries → 🔴
-   [ ] No race conditions (parallel tests sharing state) → 🔴
-   [ ] No security issues (credentials in code, SQL/XSS injection in test data helpers) → 🔴
-   [ ] Type safety — no `any` casts that hide real types, no `@ts-ignore` without justification → 🟡

---

### 5. Readability & Maintainability

-   [ ] Code is self-documenting — no comments explaining what, only why (if non-obvious) → 🟢
-   [ ] No dead code (commented-out blocks, unused branches) → 🟡
-   [ ] Consistent formatting (Prettier should handle this, but verify) → 🟢
-   [ ] Changes are minimal — no unrelated modifications mixed in → 🟡

---

## Review Output Format

Structure your review as:

```
## Summary
One-sentence overall assessment.

## Findings

### 🔴 [Category] Short description
**File:** `path/to/file.ts:lineNumber`
**Issue:** What's wrong and why it matters.
**Fix:** What to change.

### 🟡 [Category] Short description
**File:** `path/to/file.ts:lineNumber`
**Issue:** ...
**Fix:** ...

### 🟢 [Category] Short description
**File:** `path/to/file.ts:lineNumber`
**Suggestion:** ...

## Verdict
✅ Approve / ⏳ Approve with nits / ❌ Request changes
```

## Quick Reference: Common Violations

| Violation                                  | Severity | Section            |
| ------------------------------------------ | -------- | ------------------ |
| Import from `@playwright/test`             | 🔴       | Framework Patterns |
| Page-global locator without parent scoping | 🔴       | Framework Patterns |
| Missing `await`                            | 🔴       | Bug Detection      |
| Hardcoded `waitForTimeout`                 | 🔴       | Test Quality       |
| Per-page toast/error instead of fixture    | 🔴       | Framework Patterns |
| Inputs wired without `Form` component      | 🔴       | Framework Patterns |
| Relative import instead of path alias      | 🔴       | Framework Patterns |
| Duplicated logic                           | 🟡       | Clean Code         |
| Missing constant for string/number         | 🟡       | Clean Code         |
| Vague test name                            | 🟡       | Test Quality       |
| Comment explaining "what" instead of "why" | 🟢       | Readability        |
