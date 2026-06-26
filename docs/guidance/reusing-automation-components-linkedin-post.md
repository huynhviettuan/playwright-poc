# LinkedIn post — Reusing Automation Components Across Projects

Companion promo copy for [reusing-automation-components-across-projects.md](./reusing-automation-components-across-projects.md).
Paste as plain text; LinkedIn does not render Markdown. Suggested image:
[reusing-automation-components-cover.png](./images/reusing-automation-components-cover.png).

**Published article:**
https://medium.com/@tunhunh_23437/your-automation-components-are-already-reusable-your-selectors-arent-8ffaf62e72d8

## Variant A — full post (~2,000 chars)

Post the article link as your own first comment rather than in the body; LinkedIn suppresses reach on posts containing
external links.

---

3 automation repos.
3 hand-written Dropdown classes.
1 design system underneath all of them.

If your frontend teams share a component library, your test automation is almost certainly duplicating work it doesn't
need to.

I audited our Playwright framework expecting to find a big refactor. I found the opposite.

The element layer had zero upward dependencies. No imports from page objects, services, fixtures, or test data. Coupling
ran strictly downward.

Architecturally it was already a package. It just wasn't packaged.

So what was actually blocking reuse?

CSS class names, hardcoded into constructors.

Input looked for ".input"
Checkbox read state from "is-checked"
DatePicker had an entire calendar nailed down — ".popup", ".double-back", ".header", ".day"

Universal logic. One design system's strings. Written somewhere nobody could renegotiate them.

The best part: the codebase had already solved this. Twice.

Skeleton took an injectable selector. Notification took a configurable container. Both worked across design systems.
Nobody generalized the pattern to the other eight elements.

The fix isn't clever. Declare the selector vocabulary once per project, inject it into the shared package, and this line
stays byte-identical in every repo:

new Input({ label: 'Email' })

Same vocabulary. Different dialect. One place to fix things when the design system ships a major version.

Three things I'd underline for anyone trying this:

→ Hardcoded English breaks portability too. A radio group clicking "Yes"/"No" fails on a localized product even when
every CSS class matches.

→ Global singletons are a packaging hazard. Two resolved copies across a package boundary means two singletons, and
locators resolving against a page that was never navigated. It surfaces as a timeout, not as a dependency bug.

→ Path aliases make migration nearly free. Repoint the alias from src/ to the package and every existing import keeps
working, untouched. That's what gets the change merged.

And the line that decides what belongs in the package:

Share the vocabulary, not the sentences.

Input, Dropdown and Table are vocabulary — every product means the same thing by them.
SignInPage.loginAsAdmin() is a sentence. It belongs to one product.

The sharing boundary isn't something the automation team invents. The frontend already drew it when they built the
design system.

Full write-up in the comments.

#TestAutomation #Playwright #QAEngineering #SDET #SoftwareTesting

---

## Variant B — short follow-up (~600 chars)

For a second post a few days later. Hook, one insight, link. Short enough that the whole post renders without a
"see more" cut on most feeds.

---

The blocker was never the architecture.

I audited our Playwright framework to see if we could share components across projects. Zero upward dependencies — no
imports from pages, services, or fixtures. It was already a package. Nobody had packaged it.

What actually stood in the way: CSS class names hardcoded into constructors.

Input looked for ".input". That was it.

Universal logic. One design system's strings. Written where nobody could renegotiate them.

Full write-up 👇
https://medium.com/@tunhunh_23437/your-automation-components-are-already-reusable-your-selectors-arent-8ffaf62e72d8

#TestAutomation #Playwright #SDET #QAEngineering
