---
description: Always use path aliases and import test/expect from custom fixtures
globs: ['src/**/*.ts', 'tests/**/*.ts']
---

# Import Rules

## Path Aliases

Always use path aliases. Never use relative imports (`../../../`).

```ts
// ✅ Correct
import { Button } from '@elements/common/button';
import { Config } from '@constants/config.constant';

// ❌ Wrong
import { Button } from '../../../elements/common/button';
```

## Test/Expect Imports

Always import `test` and `expect` from `@fixtures/fixtures`:

```ts
// ✅ Correct
import { expect, test } from '@fixtures/fixtures';

// ❌ Wrong — bypasses all custom fixtures and matchers
import { expect, test } from '@playwright/test';
```

The only exception is inside fixture files themselves (`src/fixtures/*.ts`), which import from `@playwright/test` to
extend the base.
