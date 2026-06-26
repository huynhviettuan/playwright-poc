# Health Locator with RAG and Vector Database

Locators break when the UI changes — renamed `data-testid`, restructured DOM, updated component libraries. A **health
locator** system uses Retrieval-Augmented Generation (RAG) backed by a vector database to detect broken locators,
suggest fixes, and prevent flaky tests before they reach CI.

## Problem

| Symptom                          | Root cause                                 |
| -------------------------------- | ------------------------------------------ |
| Test fails with "element not found" | `data-testid` renamed or removed          |
| Locator matches wrong element    | DOM restructured, duplicate testids appear |
| Flaky timeout on `waitFor`       | Element moved behind a new loading state   |
| Bulk failures after UI upgrade   | Component library bump changes markup      |

Manual triage is slow — you read the error, open the app, inspect the DOM, update the locator, re-run. A health locator
automates the first three steps and suggests the fix for the fourth.

## Architecture Overview

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Locator Index   │────▶│  Vector Database  │◀────│  DOM Snapshots  │
│  (embeddings)    │     │  (Chroma / Milvus │     │  (per test run) │
│                  │     │   / Pinecone)     │     │                 │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   RAG Pipeline    │
                        │  (query + LLM)    │
                        └────────┬─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Health Report / Fix     │
                    │  Suggestions             │
                    └─────────────────────────┘
```

### Components

1. **Locator Index** — all locators from page objects are extracted, embedded, and stored with metadata (file path, line
   number, selector strategy, parent chain).
2. **DOM Snapshots** — after each test run (or on failure), the actual DOM is serialized and stored as embeddings.
3. **Vector Database** — stores both locator embeddings and DOM embeddings for similarity search.
4. **RAG Pipeline** — when a locator fails, queries the vector DB for the closest DOM match, then uses an LLM to
   suggest a corrected locator.

## Technology Choices

| Component       | Recommended                     | Alternatives                    |
| --------------- | ------------------------------- | ------------------------------- |
| Vector DB       | ChromaDB (local, zero-config)   | Milvus, Pinecone, Weaviate      |
| Embedding model | `all-MiniLM-L6-v2` (sentence-transformers) | OpenAI `text-embedding-3-small`, Cohere |
| LLM for fixes   | Claude (via Anthropic API)      | GPT-4, local Ollama model       |
| Runner          | Node.js script / Playwright reporter | Python sidecar            |

### Why ChromaDB for local development

- Runs in-process (no Docker required for dev)
- Python and JS/TS clients available
- Persistent storage to disk
- Free, open-source

### Why sentence-transformers for embeddings

- Runs locally (no API key needed)
- Fast enough for CI (~50ms per embedding)
- Good semantic similarity for HTML/selector content

## Setup Guide

### Step 1 — Install dependencies

```bash
npm install chromadb chromadb-default-embed
```

Or with Python sidecar:

```bash
pip install chromadb sentence-transformers
```

### Step 2 — Create the locator extractor

Extract all locators from page objects into a structured format.

```ts
// src/health/locator-extractor.ts
import * as fs from 'fs';
import * as path from 'path';

interface LocatorEntry {
    filePath: string;
    className: string;
    propertyName: string;
    selector: string;
    strategy: 'testid' | 'role' | 'text' | 'css' | 'xpath';
    parentChain: string[];
}

export class LocatorExtractor {
    static extract(pagesDir: string): LocatorEntry[] {
        const entries: LocatorEntry[] = [];
        const files = fs.readdirSync(pagesDir, { recursive: true }) as string[];

        for (const file of files) {
            if (!file.endsWith('.ts')) continue;
            const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
            entries.push(...LocatorExtractor.parseLocators(content, file));
        }

        return entries;
    }

    private static parseLocators(content: string, filePath: string): LocatorEntry[] {
        const entries: LocatorEntry[] = [];

        const testidPattern = /getByTestId\(['"](.+?)['"]\)/g;
        const rolePattern = /getByRole\(['"](.+?)['"](?:,\s*\{[^}]*\})?\)/g;

        let match: RegExpExecArray | null;

        while ((match = testidPattern.exec(content)) !== null) {
            entries.push({
                filePath,
                className: LocatorExtractor.extractClassName(content),
                propertyName: LocatorExtractor.extractPropertyName(content, match.index),
                selector: match[1],
                strategy: 'testid',
                parentChain: LocatorExtractor.extractParentChain(content, match.index),
            });
        }

        while ((match = rolePattern.exec(content)) !== null) {
            entries.push({
                filePath,
                className: LocatorExtractor.extractClassName(content),
                propertyName: LocatorExtractor.extractPropertyName(content, match.index),
                selector: match[0],
                strategy: 'role',
                parentChain: LocatorExtractor.extractParentChain(content, match.index),
            });
        }

        return entries;
    }

    private static extractClassName(content: string): string {
        const match = content.match(/class\s+(\w+)/);
        return match?.[1] ?? 'Unknown';
    }

    private static extractPropertyName(content: string, position: number): string {
        const before = content.slice(0, position);
        const lines = before.split('\n');
        const lastLine = lines[lines.length - 1];
        const propMatch = lastLine.match(/(?:this\.)?(\w+)\s*=/);
        return propMatch?.[1] ?? 'unknown';
    }

    private static extractParentChain(content: string, position: number): string[] {
        const before = content.slice(Math.max(0, position - 200), position);
        const parents: string[] = [];
        const parentMatches = before.matchAll(/(?:this\.)(\w+)\.locator/g);
        for (const m of parentMatches) {
            parents.push(m[1]);
        }
        return parents;
    }
}
```

### Step 3 — Build the vector index

```ts
// src/health/vector-index.ts
import { ChromaClient, Collection } from 'chromadb';

import { LocatorEntry } from './locator-extractor';

export class VectorIndex {
    private client: ChromaClient;
    private collection!: Collection;

    constructor(private dbPath: string = './.health-db') {
        this.client = new ChromaClient({ path: dbPath });
    }

    async initialize(): Promise<void> {
        this.collection = await this.client.getOrCreateCollection({
            name: 'locators',
            metadata: { 'hnsw:space': 'cosine' },
        });
    }

    async indexLocators(entries: LocatorEntry[]): Promise<void> {
        const ids = entries.map((e, i) => `${e.filePath}:${e.propertyName}:${i}`);
        const documents = entries.map(
            (e) => `${e.strategy}:${e.selector} in ${e.className}.${e.propertyName} ` +
                   `parent:[${e.parentChain.join(' > ')}]`
        );
        const metadatas = entries.map((e) => ({
            filePath: e.filePath,
            className: e.className,
            propertyName: e.propertyName,
            strategy: e.strategy,
            selector: e.selector,
        }));

        await this.collection.upsert({ ids, documents, metadatas });
    }

    async findSimilar(query: string, topK: number = 5): Promise<Array<{
        id: string;
        document: string;
        metadata: Record<string, string>;
        distance: number;
    }>> {
        const results = await this.collection.query({
            queryTexts: [query],
            nResults: topK,
        });

        return (results.ids[0] ?? []).map((id, i) => ({
            id,
            document: results.documents[0]?.[i] ?? '',
            metadata: (results.metadatas[0]?.[i] as Record<string, string>) ?? {},
            distance: results.distances?.[0]?.[i] ?? 1,
        }));
    }
}
```

### Step 4 — Create the DOM snapshot collector

Capture the DOM when a test fails for comparison against the locator index.

```ts
// src/health/dom-snapshot.ts
import { Page } from '@playwright/test';

export interface DomSnapshot {
    testName: string;
    url: string;
    timestamp: number;
    elements: DomElement[];
}

export interface DomElement {
    tagName: string;
    testId?: string;
    role?: string;
    text?: string;
    classes: string[];
    attributes: Record<string, string>;
    path: string; // CSS path from root
}

export class DomSnapshotCollector {
    static async capture(page: Page, testName: string): Promise<DomSnapshot> {
        const elements = await page.evaluate(() => {
            const result: Array<{
                tagName: string;
                testId?: string;
                role?: string;
                text?: string;
                classes: string[];
                attributes: Record<string, string>;
                path: string;
            }> = [];

            function getPath(el: Element): string {
                const parts: string[] = [];
                let current: Element | null = el;
                while (current && current !== document.body) {
                    const tag = current.tagName.toLowerCase();
                    const id = current.getAttribute('data-testid');
                    parts.unshift(id ? `${tag}[data-testid="${id}"]` : tag);
                    current = current.parentElement;
                }
                return parts.join(' > ');
            }

            document.querySelectorAll('*').forEach((el) => {
                const attrs: Record<string, string> = {};
                for (const attr of el.attributes) {
                    attrs[attr.name] = attr.value;
                }

                result.push({
                    tagName: el.tagName.toLowerCase(),
                    testId: el.getAttribute('data-testid') ?? undefined,
                    role: el.getAttribute('role') ?? undefined,
                    text: el.textContent?.trim().slice(0, 100) ?? undefined,
                    classes: Array.from(el.classList),
                    attributes: attrs,
                    path: getPath(el),
                });
            });

            return result;
        });

        return {
            testName,
            url: page.url(),
            timestamp: Date.now(),
            elements,
        };
    }
}
```

### Step 5 — Build the health checker

```ts
// src/health/health-checker.ts
import { DomSnapshot } from './dom-snapshot';
import { LocatorEntry } from './locator-extractor';
import { VectorIndex } from './vector-index';

export interface HealthResult {
    locator: LocatorEntry;
    status: 'healthy' | 'broken' | 'degraded';
    confidence: number;
    suggestion?: string;
    matchedElement?: string;
}

export class HealthChecker {
    constructor(private vectorIndex: VectorIndex) {}

    async check(locators: LocatorEntry[], snapshot: DomSnapshot): Promise<HealthResult[]> {
        const results: HealthResult[] = [];

        for (const locator of locators) {
            const result = await this.checkSingle(locator, snapshot);
            results.push(result);
        }

        return results;
    }

    private async checkSingle(locator: LocatorEntry, snapshot: DomSnapshot): Promise<HealthResult> {
        // Direct match — locator still exists in DOM
        const directMatch = snapshot.elements.find((el) => {
            if (locator.strategy === 'testid') return el.testId === locator.selector;
            if (locator.strategy === 'role') return el.role === locator.selector;
            return false;
        });

        if (directMatch) {
            return { locator, status: 'healthy', confidence: 1.0 };
        }

        // Vector similarity search — find closest match
        const query = `${locator.strategy}:${locator.selector} ${locator.className}`;
        const domDocuments = snapshot.elements
            .filter((el) => el.testId || el.role)
            .map((el) => `${el.tagName} testid:${el.testId ?? 'none'} role:${el.role ?? 'none'} ` +
                         `path:${el.path}`);

        const similar = await this.vectorIndex.findSimilar(query);

        if (similar.length > 0 && similar[0].distance < 0.3) {
            return {
                locator,
                status: 'degraded',
                confidence: 1 - similar[0].distance,
                suggestion: `Possible rename: ${similar[0].metadata.selector} → check ${similar[0].metadata.filePath}`,
                matchedElement: similar[0].document,
            };
        }

        return {
            locator,
            status: 'broken',
            confidence: 0,
            suggestion: `Locator "${locator.selector}" not found. Closest DOM elements: ` +
                        domDocuments.slice(0, 3).join(', '),
        };
    }
}
```

### Step 6 — Create a Playwright reporter

Wire the health checker into test runs as a custom Playwright reporter.

```ts
// src/health/health-reporter.ts
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

import { DomSnapshotCollector } from './dom-snapshot';
import { LocatorExtractor } from './locator-extractor';
import { HealthChecker } from './health-checker';
import { VectorIndex } from './vector-index';

class HealthReporter implements Reporter {
    private failedTests: Array<{ test: TestCase; result: TestResult }> = [];

    onTestEnd(test: TestCase, result: TestResult): void {
        if (result.status === 'failed') {
            this.failedTests.push({ test, result });
        }
    }

    async onEnd(result: FullResult): Promise<void> {
        if (this.failedTests.length === 0) return;

        const vectorIndex = new VectorIndex();
        await vectorIndex.initialize();

        const locators = LocatorExtractor.extract('src/pages');
        await vectorIndex.indexLocators(locators);

        const checker = new HealthChecker(vectorIndex);

        console.log('\n📊 Locator Health Report');
        console.log('─'.repeat(60));

        for (const { test, result: testResult } of this.failedTests) {
            const errorMessage = testResult.error?.message ?? '';
            const isLocatorError = /locator|element|not found|timeout/i.test(errorMessage);

            if (!isLocatorError) continue;

            console.log(`\n❌ ${test.title}`);
            console.log(`   Error: ${errorMessage.slice(0, 120)}`);

            // In a full implementation, DOM snapshots would be captured
            // during the test via a fixture and stored for post-run analysis
            console.log('   → Run with DOM snapshot fixture for fix suggestions');
        }

        console.log('\n' + '─'.repeat(60));
    }
}

export default HealthReporter;
```

### Step 7 — Register in Playwright config

```ts
// playwright.config.ts
export default defineConfig({
    reporter: [
        ['html'],
        ['./src/health/health-reporter.ts'],
    ],
});
```

## Using the RAG Pipeline for Fix Suggestions

When the health checker finds a broken locator, the RAG pipeline queries the vector DB for similar DOM elements, then
sends context to an LLM to generate a fix.

```ts
// src/health/rag-fix-suggester.ts
import Anthropic from '@anthropic-ai/sdk';

import { HealthResult } from './health-checker';
import { VectorIndex } from './vector-index';

export class RagFixSuggester {
    private anthropic: Anthropic;

    constructor(private vectorIndex: VectorIndex) {
        this.anthropic = new Anthropic();
    }

    async suggest(brokenResults: HealthResult[]): Promise<Map<string, string>> {
        const fixes = new Map<string, string>();

        for (const result of brokenResults.filter((r) => r.status === 'broken')) {
            const context = await this.vectorIndex.findSimilar(
                result.locator.selector, 10
            );

            const contextText = context
                .map((c) => `- ${c.document} (distance: ${c.distance.toFixed(3)})`)
                .join('\n');

            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `A Playwright locator broke. Suggest a fix.

Broken locator:
- Strategy: ${result.locator.strategy}
- Selector: ${result.locator.selector}
- Page object: ${result.locator.className}.${result.locator.propertyName}
- File: ${result.locator.filePath}

Similar elements found in current DOM:
${contextText}

${result.matchedElement ? `Closest match: ${result.matchedElement}` : 'No close match found.'}

Reply with ONLY the corrected TypeScript line. No explanation.`,
                }],
            });

            const fix = response.content[0].type === 'text'
                ? response.content[0].text
                : '';

            const key = `${result.locator.filePath}:${result.locator.propertyName}`;
            fixes.set(key, fix);
        }

        return fixes;
    }
}
```

## Directory Structure

```text
src/health/
├── locator-extractor.ts     # Parse page objects → LocatorEntry[]
├── vector-index.ts          # ChromaDB wrapper for indexing and querying
├── dom-snapshot.ts           # Capture DOM state on failure
├── health-checker.ts         # Compare locators against DOM snapshots
├── health-reporter.ts        # Playwright reporter integration
└── rag-fix-suggester.ts      # LLM-powered fix suggestions
```

## Workflow

```text
1. Index          npm run health:index        Extract & embed all locators
2. Test run       npx playwright test         DOM snapshots captured on failure
3. Health check   npm run health:check        Compare locators vs DOM
4. Fix suggest    npm run health:fix          RAG pipeline suggests corrections
```

### npm scripts

```json
{
    "scripts": {
        "health:index": "ts-node src/health/locator-extractor.ts",
        "health:check": "ts-node src/health/health-checker.ts",
        "health:fix": "ts-node src/health/rag-fix-suggester.ts"
    }
}
```

## When to Use

- **After a UI library upgrade** — run `health:check` to find all broken locators at once
- **In CI on failure** — the reporter flags locator-related failures with fix suggestions
- **During refactoring** — verify that locator changes don't miss renamed testids
- **Periodic health scan** — schedule `health:index && health:check` as a CI job

## When NOT to Use

- Tests failing due to logic errors (not locator issues)
- Brand new pages with no prior locator history
- Environments where LLM API calls are not allowed (use `health:check` without `health:fix`)

## Configuration

Environment variables:

| Variable              | Default                | Description                      |
| --------------------- | ---------------------- | -------------------------------- |
| `HEALTH_DB_PATH`      | `./.health-db`         | ChromaDB storage directory       |
| `HEALTH_SIMILARITY`   | `0.3`                  | Distance threshold for "degraded"|
| `ANTHROPIC_API_KEY`   | —                      | Required for RAG fix suggestions |
| `HEALTH_TOP_K`        | `5`                    | Number of similar results        |

## Limitations

- Embedding quality depends on the model — HTML structure is not natural language, so results may need tuning
- ChromaDB in-process mode is single-threaded; for large projects consider a Milvus or Pinecone deployment
- LLM suggestions are not guaranteed correct — always review before applying
- DOM snapshots can be large; filter to interactive elements (`button`, `input`, `a`, `[data-testid]`) to reduce noise

## Future Enhancements

- **Auto-apply fixes** — pipe suggestions into `Edit` operations with human approval
- **Historical tracking** — store locator health over time to identify fragile areas
- **Visual regression tie-in** — combine with screenshot diffs for multi-signal detection
- **Embedding fine-tuning** — train on project-specific HTML patterns for better similarity

## Related

- [Page Object Pattern](../decisions/ADR-001-container-based-page-objects.md)
- [Custom Fixtures](../decisions/ADR-002-custom-fixtures.md)
- [Explore Screens Skill](../../.claude/skills/explore-screens.md)
