---
description: Generate a flat SVG architecture/flow diagram (optionally export PNG)
argument-hint: <what to diagram>
---

Create a horizontal architecture/flow diagram for: **$ARGUMENTS**

Output a clean, flat SVG (viewBox 800x520, system-ui font, no gradients or shadows):

-   Group boxes into labeled sections with uppercase gray section headers.
-   Connect boxes with arrows; number the main happy-path steps as small filled accent circles with white digits.
-   Use at most 2 color ramps (neutral + one accent); reserve green/amber only for status/output boxes.
-   Rounded 8px corners, thin (~1.2px) connectors, dashed lines for any async/LLM path.
-   Add a small legend if colors or line styles carry meaning.

Save it to `docs/articles/<kebab-name>.svg`. Then also export a PNG of the same name by screenshotting the SVG with
Playwright (`page.locator('svg').screenshot(...)`). If this diagram belongs to an article, add the image reference to
that article.
