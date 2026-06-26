# Prompt Library

Reusable prompts for working on this repository with an AI assistant (Claude Code or similar). Each prompt is written
to trigger the right [skill](../../.claude/skills/README.md) and respect the framework's non-negotiables (custom
fixtures, parent-scoped locators, page objects, path aliases).

## How to use

- Copy a prompt, fill in the `<angle-bracket>` placeholders, and send it.
- Prompts deliberately name the skill or doc to read first — this keeps output aligned with our conventions.
- Keep the [CLAUDE.md](../../CLAUDE.md) rules in context; the assistant should always read the relevant skill before
  writing code.

---

## Creation

### Build a page object

```
Read .claude/skills/create-page-object.md, then create a container-based page object for the
<feature> screen. Use Header/Main/Footer containers, parent-scoped locators only, and a Form
component where the screen has form inputs. Register it in src/fixtures/fixtures.ts.
```

### Add a custom element

```
Read .claude/skills/create-custom-element.md, then add a <ElementName> element class that extends
<BaseControl | Clickable | Editable>. Follow the existing element hierarchy and expose only the
operations this control needs.
```

### Add an API service

```
Read .claude/skills/create-api-service.md, then create a <Resource>Service extending BaseService
for the <resource> endpoints. Add types in src/models, endpoints in the endpoints constant, and
register the service in fixtures.
```

### Generate a service from Swagger

```
Read .claude/skills/create-service-from-swagger.md, then generate a service, request/response
types, and fixtures from this OpenAPI spec: <url-or-path>.
```

---

## Writing tests

### E2E test

```
Read .claude/skills/write-e2e-test.md, then write an E2E test for <scenario>. Import test/expect
from @fixtures/fixtures, keep logic in page objects, use the notification fixture for messages, and
follow Arrange-Act-Assert.
```

### Behavior-style test (recommended for sign-off)

```
Read docs/guidance/behavior-testing.md and .claude/skills/write-behavior-test.md, then write a
behavior-style spec for <scenario> using the given/when/then DSL. Tag the test with @AC-<id>, and
delegate each step body to page objects.
```

### API test

```
Read .claude/skills/write-api-test.md, then write an API test for <endpoint/scenario> using the
<Resource>Service fixture. Assert status and response body; validate the schema if one exists.
```

### Accessibility test

```
Read .claude/skills/write-a11y-test.md, then write an accessibility test for <screen> using the
a11y fixture (@axe-core/playwright). Assert there are no violations for <ruleset/scope>.
```

---

## Discovery & planning

### Explore a screen

```
Read .claude/skills/explore-screens.md, then explore <url>. Capture UI locators (prefer data-testid,
parent-scoped) and the API endpoints the screen calls, in one pass.
```

### Turn a user story into test cases

```
Read .claude/skills/generate-test-cases.md, then read docs/user-stories/<feature>.md and produce
docs/test-cases/<feature>.md. Trace each case back to its acceptance-criteria ID.
```

---

## Maintenance

### Review changes

```
Read .claude/skills/code-review.md, then review my current diff against the framework patterns,
clean-code rules, and test quality. Flag parent-scoping violations and any imports from
@playwright/test instead of @fixtures/fixtures.
```

### Refactor to follow skills

```
Read .claude/skills/refactor-code-follow-skills.md, then migrate <file/dir> to follow all skills:
parent-scoped locators, Form component, notification fixture, custom fixtures, path aliases.
```

### Debug a failing/flaky test

```
Read .claude/skills/debug-tests.md, then help me diagnose <test name/path>. Here's the error:
<paste error>. Classify the failure, find the root cause, and propose a targeted fix.
```

---

## Documentation & diagrams

### Architecture / flow diagram (SVG)

Used to generate the [health locator diagram](../articles/health-locator-rag-architecture.svg). Adapt the boxes and
sections for any system:

```
Create a horizontal architecture flow diagram titled "<title>" as a clean, flat SVG
(viewBox 800x520, system-ui font, no gradients/shadows). Group boxes into labeled sections
(uppercase gray headers): <SECTION: box "<name>" subtitle "<detail>", ...>. Connect them with
arrows, numbering the main happy-path steps as small filled circles. Use 2 color ramps max
(neutral + one accent; reserve green/amber for status outputs), rounded 8px corners, thin
connectors, and dashed lines for any LLM/async path. Add a small legend. Save as
docs/articles/<name>.svg.
```

To also export a PNG: `add "then convert it to PNG with the same name"` — the assistant screenshots the SVG via
Playwright.

### Write a guidance doc

```
Read a couple of existing files in docs/guidance/ to match the house format, then write
docs/guidance/<topic>.md covering <what/when/how>. Keep it one-pattern-per-file, add a ## Related
section, and register it in docs/guidance/README.md.
```

### Write an ADR

```
Read docs/decisions/README.md for the template, then draft ADR-<next-number>-<slug>.md recording
the decision to <decision>. Include Context, Decision, Consequences, and Alternatives Considered.
ADRs are append-only — supersede, never edit accepted ones.
```

---

## Tips for good prompts in this repo

- **Name the skill to read first** — e.g. "Read `.claude/skills/write-e2e-test.md`, then…". It anchors the output to our
  conventions.
- **State the non-negotiables you care about** — parent-scoped locators, `@fixtures/fixtures` imports, page-object
  delegation. The assistant should follow these anyway, but repeating the high-risk ones reduces drift.
- **Point at real examples** — "follow the pattern in `src/pages/sign-in.page.ts`" beats a generic description.
- **Ask for a plan on anything non-trivial** — "plan it first" before multi-file changes so you can course-correct
  cheaply.
- **Use path aliases in your ask** — reference `@pages/*`, `@services/*`, etc., not relative paths.

## Related

- [Skills index](../../.claude/skills/README.md) — the how-to recipes these prompts trigger
- [CLAUDE.md](../../CLAUDE.md) — project rules and non-negotiable patterns
- [Guidance index](./README.md) — pattern explanations
