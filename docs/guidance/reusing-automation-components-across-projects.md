# Your Automation Components Are Already Reusable. Your Selectors Aren't.

Join a company with more than one product and you'll find the same thing on the frontend: a shared design system. One
`<Input>`, one `<Dropdown>`, one `<DatePicker>`, imported by every app in the org. The billing app and the admin portal
look different, but they're built from identical bricks.

Now look at the automation repos. Almost always, each one has its own hand-rolled `Input` class, its own `Dropdown`, its
own `DatePicker` — three implementations of the same thing, drifting apart, each breaking independently the next time
the design system ships a major version.

This is worth fixing, and it's less work than most teams assume. But the obstacle is usually not the one people expect.

## The Premise: Same Component, Same DOM

The argument for sharing automation components is simple. If the frontend renders the same design-system `<Input>` in
every project, then the DOM is the same in every project. Same wrapper class, same label association, same disabled
state, same validation markup. A page-element class that knows how to drive that DOM is therefore correct in every
project, by construction.

Writing it three times isn't just duplicated effort — it's _divergent_ effort. Three teams each discover the design
system's quirks separately, at different times, and encode three slightly different workarounds. When the design system
changes, all three break, and all three get fixed differently.

## Step One: Audit Before You Extract

Before extracting anything, sort the framework into three rings. Working from a real Playwright + TypeScript framework,
the split looks like this:

**Ring 1 — portable core.** Genuinely app-agnostic. The base class hierarchy (`BaseControl` → `Clickable` / `Editable`),
the locator helpers, the pure utilities: date math, data generation, Excel reading, array helpers. None of this knows
what product it's testing.

**Ring 2 — design-system-bound.** Classes whose _behavior_ is universal but whose _selectors_ belong to one design
system: `Input`, `CheckBox`, `Dropdown`, `DatePicker`, `GroupRadioButton`. This is the ring that matters. It's the ring
you most want to share, and the ring that resists sharing hardest.

**Ring 3 — app-specific.** Page objects, API services, endpoint constants, UI copy constants, test data, environment
config. This should never be shared, and we'll come back to why.

The interesting question is what's actually stopping Ring 2 from moving into a package.

## The Surprise: Architecture Isn't the Blocker

The usual assumption is that the element layer is too entangled with the rest of the framework to extract — that `Input`
somehow reaches into page objects, or that services and elements are knotted together.

In this framework, that assumption is simply false. Grepping every import across the entire element and component layer
for references to pages, services, fixtures, test data, or notifications returns **nothing**:

```bash
rg "@pages/|@services/|@fixtures/|@data/" src/elements src/components
# No matches found
```

The coupling only ever runs the other way. Fixtures import page objects; page objects import elements; elements import
nothing above themselves. That's a clean layered dependency graph, and it means the extraction is architecturally
unblocked before you write a line of code.

The full dependency closure a shared package would need to carry is small and knowable:

-   the browser singleton and the locator helper functions (`$`, `$getByText`, `$getByRole`, …)
-   the element enums and the element interfaces
-   three constants — a downloads path, a long timeout, and a date-format default
-   two utility functions, used by exactly one element each (`ArrayHelper.forEachSync` in `Dropdown`, `DateTimeHelper`
    in `DatePicker`)

That's the whole bill. Nothing there is hard to move.

## The Real Blocker: Class Names Welded Into Constructors

Here's what actually stops the code from porting. `Input` doesn't find an input — it finds an input _inside a `.input`
wrapper_:

```ts
if (opt?.label) {
    return base
        .locator('.input', {
            has: $getByText(opt.label, { exact: true })
        })
        .locator(selector);
}

return base.locator(`.input ${selector}`);
```

`CheckBox` does the same, and reads state from a CSS class:

```ts
baseLocator.getByLabel(option.label).locator('..').locator('.checkbox');
// ...
if ((await this.element.locator('input').getAttribute('class')).includes('is-checked')) {
```

`Dropdown` hardcodes two:

```ts
baseLocator.locator('.dropdown', { has: $getByText(option.label, { exact: true }) }).locator('.select');
```

And `DatePicker` is the worst offender — an entire calendar's markup, nailed down:

```ts
parentLocator.locator('.date-picker', { hasText: label });
this.calendar = $('.popup');
new Image({ locator: this.calendar.locator('.double-back') });
new Image({ locator: this.calendar.locator('.double-next') });
this.lblHeader = new Label({ parentLocator: this.calendar, locator: '.header' });
this.lblDay = new Label({ parentLocator: this.calendar, locator: '.day' });
```

Even the table component leaks a specific icon font:

```ts
return this.getCellByValue(cellValue).locator('..').locator('.font-icon--three-dot');
```

Every one of these is a **contract with one particular design system, written in a place where it can't be
renegotiated**. The logic around them is perfectly reusable. The strings are not. Move this file to a project whose
design system calls its wrapper `.field` instead of `.input`, and nothing works — not because the class is wrong, but
because a constant got hardcoded where a parameter belonged.

## The Fix Is Already in the Codebase

The good news: this framework already solved the problem twice, and nobody generalized the solution.

`Skeleton` accepts a `selector` and defaults to a union that spans several design systems:

```ts
const DEFAULT_SKELETON_SELECTOR = ['.skeleton', '.ant-skeleton', '.MuiSkeleton-root', '[data-testid*="skeleton"]', '[class*="skeleton"]'].join(', ');

constructor(option?: { parentLocator?: Locator; locator?: Locator; selector?: string }) {
    const selector = option?.selector || DEFAULT_SKELETON_SELECTOR;
```

`Notification` does the same with two injectable selectors:

```ts
constructor(options: { containerSelector?: string; messageChildSelector?: string } = {}) {
    const containerSelector = options.containerSelector ?? DEFAULT_CONTAINER_SELECTOR;
    const childSelector = options.messageChildSelector ?? DEFAULT_MESSAGE_CHILD_SELECTOR;
```

That's the pattern the whole element layer needs. Not per-call-site overrides — the classes already accept a raw
`locator` escape hatch, and using it everywhere just relocates the duplication into your page objects. What you want is
the selector vocabulary declared **once per project** and injected into the shared package:

```ts
// project-a/src/setup/element-config.ts
configureElements({
    input: { wrapper: '.input' },
    checkbox: { wrapper: '.checkbox', checkedClass: 'is-checked' },
    dropdown: { wrapper: '.dropdown', trigger: '.select', option: 'li' },
    datePicker: { wrapper: '.date-picker', popup: '.popup', header: '.header', day: '.day' }
});
```

```ts
// project-b/src/setup/element-config.ts — different design system, same package
configureElements({
    input: { wrapper: '.form-field' },
    checkbox: { wrapper: '.ds-checkbox', checkedClass: 'ds-checkbox--checked' },
    dropdown: { wrapper: '.ds-select', trigger: '.ds-select__trigger', option: '[role="option"]' },
    datePicker: { wrapper: '.ds-datepicker', popup: '.ds-overlay', header: '.ds-cal__title', day: '.ds-cal__day' }
});
```

The payoff is that the _call sites never change_. In both projects, a page object still says:

```ts
const email = new Input({ label: 'Email', parentLocator: this.container });
```

The vocabulary is shared. The dialect is configured. That's the whole idea.

## Don't Forget the Copy

Selectors get all the attention, but hardcoded English breaks portability just as thoroughly. `GroupRadioButton` decides
between two options by matching literal text:

```ts
await this.element.getByText(isYes ? 'Yes' : 'No').click();
```

And `DatePicker` parses its calendar header against a hardcoded month table (`'Jan' … 'Dec'`), which means it silently
fails the moment it meets a Vietnamese or German locale — even if the design system and every CSS class is identical.

If your product line is localized, locale-bound strings belong in the same injected config as the selectors.

## The Caveat Nobody Mentions: Shared Global State

Every element in this framework reaches the page through a static singleton — `BrowserInstance.currentPage`. That's safe
inside a single test process (Playwright runs one worker per process, so there's no cross-test contention), and it's the
right call for this design.

But it becomes a real hazard the moment the code lives in a package. If the consuming repo and the shared package
resolve to _two different copies_ of the module — easy to do with mismatched versions or a stray nested `node_modules` —
you get two singletons. The package writes to one, your fixtures read from the other, and every locator resolves against
a page that was never navigated. The failure looks like a mysterious timeout, not a dependency-resolution bug, which is
what makes it expensive.

The mitigation is boring and important: declare `@playwright/test` as a **peer dependency**, never a direct one, and
keep the singleton in exactly one package that everything else depends on.

## Packaging It

Most automation repos are configured as applications, not libraries. This one is typical — `"main": "index.js"` pointing
at a file that doesn't exist, and no `exports`, `files`, `types`, or `publishConfig` anywhere. Publishing means adding
the library manifest that was never needed before:

```jsonc
{
    "name": "@org/pw-elements",
    "version": "1.0.0",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": "./dist/index.js",
        "./elements": "./dist/elements/index.js",
        "./components": "./dist/components/index.js"
    },
    "files": ["dist"],
    "publishConfig": {
        "registry": "https://npm.pkg.github.com"
    },
    "peerDependencies": {
        "@playwright/test": ">=1.55.0"
    }
}
```

Two things worth calling out. `files` restricts the published tarball to build output, so consumers can't accidentally
import from your source tree and couple themselves to your internal layout. And `@playwright/test` sits in
`peerDependencies` for exactly the singleton reason above — the consuming project owns the Playwright version, and there
is only ever one.

## Consuming It in the Next Project

This is where path aliases pay off unexpectedly well. The existing `tsconfig.json` maps aliases to local folders:

```jsonc
"@elements/*":   ["src/elements/*"],
"@components/*": ["src/components/*"],
```

In a consuming project, point those same aliases at the package instead:

```jsonc
"@elements/*":   ["node_modules/@org/pw-elements/dist/elements/*"],
"@components/*": ["node_modules/@org/pw-elements/dist/components/*"],
```

Every existing `import { Input } from '@elements/common/input'` keeps working, unchanged. You can migrate a repo to the
shared package without touching a single import statement — which matters enormously for getting the change reviewed and
merged.

When one project's design system genuinely drifts, extend locally rather than forking the package:

```ts
// project-b/src/elements/searchable-dropdown.ts
import { Dropdown } from '@elements/common/dropdown';

export class SearchableDropdown extends Dropdown {
    async selectBySearch(text: string): Promise<void> {
        await this.cpnDropdown.click();
        await this.cpnDropdown.locator('input').fill(text);
        await this.lblOption.filter({ hasText: text }).click();
    }
}
```

## Versioning Is the Point, Not the Overhead

Tie the package's major version to the design system's major version. If the design system renames `.input` to
`.form-field`, that's a breaking change, and it gets a major bump.

This feels like bureaucracy until you've lived the alternative. Without the package, a design-system release breaks four
automation repos silently, on four different days, and four people debug the same failure in parallel without knowing
about each other. With it, one person updates one selector config, ships `2.0.0`, and every project upgrades
deliberately when it's ready. You haven't added work — you've made work that was already happening visible and
single-sourced.

## What Not to Share

The failure mode for shared libraries is scope creep, so be explicit about the boundary. Do **not** share:

-   **Page objects** — they encode one product's screens. A `SignInPage` that has to serve four products becomes a
    configuration nightmare within two quarters.
-   **API services and endpoints** — different backends, different contracts.
-   **UI copy constants** — validation messages differ per product even when the components don't.
-   **Test data and environment config** — obviously per-project, but it sneaks in via "shared" helpers that quietly
    read `process.env`.

The useful line: **share the vocabulary, not the sentences.** `Input`, `Dropdown`, and `Table` are vocabulary — every
product uses them and means the same thing. `SignInPage.loginAsAdmin()` is a sentence. It belongs to one product.

## Closing Thought

The reason this works is that the sharing boundary isn't invented — it's inherited. The frontend already decided which
components are common when it built the design system, and that decision is the correct seam for the automation layer
too.

So the practical question isn't "should we build a shared automation library?" It's "does our element layer's public API
match the design system's component API, and are its selectors configuration or concrete?" Get those two right and
extraction is mostly a packaging exercise. Get them wrong and no amount of monorepo tooling will save you — you'll just
have your duplication in a more central location.

---

_The element architecture referenced throughout is documented in
[create-custom-element.md](../../.claude/skills/create-custom-element.md); the layering rationale is in
[ADR-003](../decisions/ADR-003-solid-principles-complex-elements.md)._
