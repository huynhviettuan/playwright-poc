# Skill: Health Locator

## When to Use

Use this skill when you need to detect broken locators, diagnose locator-related test failures, or set up the RAG-based
health locator system for automatic fix suggestions.

## When NOT to Use

| Situation                          | Use instead                             |
| ---------------------------------- | --------------------------------------- |
| Writing a new test from scratch    | `write-e2e-test.md` / `write-api-test.md` |
| Building a new page object         | `create-page-object.md`                 |
| Debugging non-locator failures     | `debug-tests.md`                        |
| Exploring a screen for locators    | `explore-screens.md`                    |

## Workflow

```
1. Extract    → parse all locators from page objects
2. Index      → embed locators into vector database
3. Snapshot   → capture DOM on test failure
4. Compare    → similarity search: broken locator vs current DOM
5. Suggest    → RAG pipeline generates fix suggestions
6. Apply      → review and apply corrections
```

## Prerequisites

### Install dependencies

```bash
npm install chromadb chromadb-default-embed
```

For RAG fix suggestions (optional):

```bash
npm install @anthropic-ai/sdk
```

### Environment variables

```env
HEALTH_DB_PATH=./.health-db
HEALTH_SIMILARITY=0.3
HEALTH_TOP_K=5
ANTHROPIC_API_KEY=sk-...       # only needed for RAG fix suggestions
```

## Step 1: Extract Locators

The extractor scans all page objects and produces a structured list of every locator with its metadata.

```ts
// src/health/locator-extractor.ts
import { LocatorExtractor } from './locator-extractor';

const entries = LocatorExtractor.extract('src/pages');
console.log(`Found ${entries.length} locators`);
```

Each entry contains:

| Field         | Description                                |
| ------------- | ------------------------------------------ |
| `filePath`    | Source file relative to pages directory     |
| `className`   | Page object class name                     |
| `propertyName`| Property or variable holding the locator   |
| `selector`    | The actual selector string                 |
| `strategy`    | `testid`, `role`, `text`, `css`, `xpath`   |
| `parentChain` | Parent locators this is scoped under       |

### What gets extracted

```ts
// This page object:
export class SignInPage {
    readonly emailInput = this.main.getByTestId('email-input');
    readonly submitBtn = this.main.getByRole('button', { name: 'Sign in' });
}

// Produces:
// { strategy: 'testid', selector: 'email-input', className: 'SignInPage', propertyName: 'emailInput' }
// { strategy: 'role',   selector: 'button[name=Sign in]', className: 'SignInPage', propertyName: 'submitBtn' }
```

## Step 2: Build the Vector Index

```ts
import { VectorIndex } from './vector-index';
import { LocatorExtractor } from './locator-extractor';

const index = new VectorIndex();
await index.initialize();

const locators = LocatorExtractor.extract('src/pages');
await index.indexLocators(locators);
```

### How embeddings work

Each locator is embedded as a document string combining its strategy, selector, class, property, and parent chain:

```
testid:email-input in SignInPage.emailInput parent:[main]
```

ChromaDB uses cosine similarity — when a locator breaks, we search for the closest DOM element that _used to_ match.

## Step 3: Capture DOM Snapshots

Add the DOM snapshot collector to your test fixtures so it captures state on failure.

### Create the fixture

```ts
// src/fixtures/health-fixtures.ts
import { test as base } from '@fixtures/fixtures';
import { DomSnapshotCollector, DomSnapshot } from '@health/dom-snapshot';

type HealthFixtures = {
    domSnapshot: DomSnapshot | null;
};

export const test = base.extend<HealthFixtures>({
    domSnapshot: [async ({ page }, use, testInfo) => {
        let snapshot: DomSnapshot | null = null;
        await use(snapshot);

        // Capture on failure only
        if (testInfo.status === 'failed') {
            snapshot = await DomSnapshotCollector.capture(page, testInfo.title);
            const snapshotPath = testInfo.outputPath('dom-snapshot.json');
            await fs.promises.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
            testInfo.attachments.push({
                name: 'dom-snapshot',
                path: snapshotPath,
                contentType: 'application/json',
            });
        }
    }, { auto: true }],
});
```

### Register in fixtures.ts

```ts
import { test as healthTest } from './health-fixtures';

export const test = mergeTests(baseTest, healthTest, /* ...other fixtures */);
```

## Step 4: Run the Health Check

```ts
import { HealthChecker } from './health-checker';
import { VectorIndex } from './vector-index';
import { LocatorExtractor } from './locator-extractor';

const index = new VectorIndex();
await index.initialize();

const locators = LocatorExtractor.extract('src/pages');
const checker = new HealthChecker(index);

// Load a DOM snapshot from a failed test
const snapshot = JSON.parse(fs.readFileSync('test-results/dom-snapshot.json', 'utf-8'));
const results = await checker.check(locators, snapshot);

// Filter broken locators
const broken = results.filter((r) => r.status === 'broken');
const degraded = results.filter((r) => r.status === 'degraded');

console.log(`Healthy: ${results.length - broken.length - degraded.length}`);
console.log(`Degraded: ${degraded.length}`);
console.log(`Broken: ${broken.length}`);
```

### Health statuses

| Status     | Meaning                                    | Action                  |
| ---------- | ------------------------------------------ | ----------------------- |
| `healthy`  | Locator found an exact match in the DOM    | None                    |
| `degraded` | Similar element found (distance < 0.3)     | Review — likely renamed |
| `broken`   | No match found                             | Fix required            |

## Step 5: Get RAG Fix Suggestions

```ts
import { RagFixSuggester } from './rag-fix-suggester';

const suggester = new RagFixSuggester(index);
const fixes = await suggester.suggest(broken);

for (const [location, fix] of fixes) {
    console.log(`${location}:`);
    console.log(`  → ${fix}`);
}
```

### Example output

```
pages/sign-in.page.ts:emailInput:
  → this.main.getByTestId('email-field')

pages/sign-in.page.ts:submitBtn:
  → this.main.getByRole('button', { name: 'Log in' })
```

## Step 6: Integrate as Playwright Reporter

Add the health reporter to `playwright.config.ts`:

```ts
export default defineConfig({
    reporter: [
        ['html'],
        ['./src/health/health-reporter.ts'],
    ],
});
```

The reporter runs automatically after each test suite and prints a health report for locator-related failures.

## npm Scripts

Add to `package.json`:

```json
{
    "scripts": {
        "health:index": "ts-node src/health/locator-extractor.ts",
        "health:check": "ts-node src/health/health-checker.ts",
        "health:fix": "ts-node src/health/rag-fix-suggester.ts",
        "health:full": "npm run health:index && npm run health:check && npm run health:fix"
    }
}
```

## CI Integration

### GitHub Actions

```yaml
- name: Run health check on failure
  if: failure()
  run: |
    npm run health:index
    npm run health:check
    npm run health:fix > health-report.txt

- name: Upload health report
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: health-report
    path: health-report.txt
```

### GitLab CI

```yaml
health-check:
  stage: post-test
  when: on_failure
  script:
    - npm run health:full > health-report.txt
  artifacts:
    paths:
      - health-report.txt
    when: on_failure
```

## File Structure

```
src/health/
├── locator-extractor.ts     # Parse page objects → LocatorEntry[]
├── vector-index.ts          # ChromaDB wrapper
├── dom-snapshot.ts           # Capture DOM state on failure
├── health-checker.ts         # Compare locators against DOM snapshots
├── health-reporter.ts        # Playwright reporter integration
└── rag-fix-suggester.ts      # LLM-powered fix suggestions
```

## Checklist

- [ ] `chromadb` and `chromadb-default-embed` installed
- [ ] `HEALTH_DB_PATH` configured (default `./.health-db`)
- [ ] `.health-db/` added to `.gitignore`
- [ ] Locator extractor covers all page object directories
- [ ] DOM snapshot fixture registered in `fixtures.ts`
- [ ] Health reporter added to `playwright.config.ts`
- [ ] `ANTHROPIC_API_KEY` set (if using RAG fix suggestions)
- [ ] npm scripts added to `package.json`
- [ ] CI step added for post-failure health check

## Related

- [Health Locator Guidance](../../docs/guidance/health-locator-rag.md) — architecture, tech choices, code details
- [`explore-screens.md`](./explore-screens.md) — manual locator discovery
- [`debug-tests.md`](./debug-tests.md) — general test debugging workflow
- [`create-page-object.md`](./create-page-object.md) — page object patterns the extractor parses
