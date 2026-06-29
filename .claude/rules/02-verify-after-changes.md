---
description: Always verify TypeScript compilation after creating or editing source files
globs: ['src/**/*.ts', 'tests/**/*.ts']
---

# Verify After Changes

After creating or editing `.ts` files, run:

```bash
npx tsc --noEmit
```

Filter for errors related to your changes. Pre-existing errors from optional dependencies (axe-core, pg) are acceptable
— new errors from your code are not.

Do not report work as complete until compilation passes.
