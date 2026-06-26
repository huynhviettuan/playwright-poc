# API Testing with RAG

Use Retrieval-Augmented Generation (RAG) to generate, maintain, debug, and test API tests. This document covers four
complementary use cases — each can be adopted independently.

## Overview

| Use Case                  | Input                              | RAG Retrieves                              | Output                          |
| ------------------------- | ---------------------------------- | ------------------------------------------ | ------------------------------- |
| Test generation           | Swagger spec + business rules      | Existing tests, service patterns, models   | New test files                  |
| Test maintenance          | Schema diff / changelog            | Affected services, tests, type definitions | Migration patches               |
| Testing RAG applications  | RAG app endpoints                  | Expected retrieval results, ground truth   | Relevance & accuracy assertions |
| Debugging assistance      | Failed test output                 | Logs, similar failures, API docs           | Root cause + fix suggestion     |

---

## 1. RAG-Powered Test Generation

Automatically generate API test cases by retrieving context from Swagger specs, existing tests, and business rules.

### Architecture

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Swagger / OAS   │     │  Existing Tests   │     │  Business Rules  │
│  spec files      │     │  (tests/api/)     │     │  (user stories)  │
└────────┬─────────┘     └────────┬──────────┘     └────────┬─────────┘
         │                        │                          │
         └────────────────┬───────┴──────────────────────────┘
                          ▼
                ┌──────────────────┐
                │  Vector Database │
                │  (ChromaDB)      │
                └────────┬─────────┘
                         ▼
                ┌──────────────────┐
                │  RAG Pipeline    │
                │  Query + LLM    │
                └────────┬─────────┘
                         ▼
                ┌──────────────────┐
                │  Generated Tests │
                │  (review + run)  │
                └──────────────────┘
```

### What Gets Indexed

| Source                        | Embedding Content                                          | Metadata                          |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Swagger operations            | `METHOD /path` + summary + request/response schemas        | tag, operationId, status codes    |
| Existing test files           | Test title + Arrange/Act/Assert body                       | file path, service used           |
| Service classes               | Method signatures + endpoint mapping                       | service name, base path           |
| Type definitions (`@models/`) | Interface fields with types                                | model name, file path             |
| User stories / AC             | Acceptance criteria text                                   | feature, AC ID                    |
| Framework skills              | Patterns from `.claude/skills/write-api-test.md`           | skill name                        |

### Generation Pipeline

```ts
// src/rag/api-test-generator.ts
import Anthropic from '@anthropic-ai/sdk';

import { VectorIndex } from '../health/vector-index';

export interface GenerationRequest {
    endpoint: string;       // e.g. "POST /users"
    swaggerSpec?: string;   // raw OAS JSON for this endpoint
    scenario?: string;      // e.g. "should return 400 when email is missing"
}

export class ApiTestGenerator {
    private anthropic: Anthropic;

    constructor(private vectorIndex: VectorIndex) {
        this.anthropic = new Anthropic();
    }

    async generate(request: GenerationRequest): Promise<string> {
        // 1. Retrieve similar tests
        const similarTests = await this.vectorIndex.findSimilar(
            `API test for ${request.endpoint} ${request.scenario ?? ''}`, 5
        );

        // 2. Retrieve service definition
        const serviceContext = await this.vectorIndex.findSimilar(
            `service method ${request.endpoint}`, 3
        );

        // 3. Retrieve type definitions
        const typeContext = await this.vectorIndex.findSimilar(
            `interface model ${request.endpoint.split('/').pop()}`, 3
        );

        const context = [
            '## Similar existing tests',
            ...similarTests.map((t) => t.document),
            '## Service definitions',
            ...serviceContext.map((s) => s.document),
            '## Type definitions',
            ...typeContext.map((t) => t.document),
        ].join('\n');

        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: `Generate a Playwright API test following these framework conventions:

Endpoint: ${request.endpoint}
${request.swaggerSpec ? `Swagger spec:\n${request.swaggerSpec}` : ''}
${request.scenario ? `Scenario: ${request.scenario}` : ''}

Framework context (retrieved):
${context}

Rules:
- Import test/expect from '@fixtures/fixtures'
- Use StatusCodes enum from 'http-status-codes'
- Use controller pattern: service.setToken(token) once, then call methods
- Use Arrange/Act/Assert structure
- Use DataGenerator for test data
- Follow existing test naming conventions

Return ONLY the TypeScript test file content.`,
            }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    }
}
```

### Usage

```bash
# Index all sources
npm run rag:index

# Generate a test
npm run rag:generate -- --endpoint "POST /users" --scenario "should create user with valid data"
```

### When to Use

- Bootstrapping tests for a new API module with many endpoints
- Generating negative/edge-case tests from Swagger validation rules
- Ensuring generated tests follow framework conventions via retrieved examples

---

## 2. RAG for Test Maintenance

Keep API tests in sync when endpoints, schemas, or response shapes change.

### Problem

| Change                          | Impact                                              |
| ------------------------------- | --------------------------------------------------- |
| Field renamed in response       | Type mismatch, assertion fails at runtime           |
| Endpoint path changed           | Service method hits 404                             |
| New required field added        | Create/update tests miss the field, get 400         |
| Status code changed (201 → 200) | Assertion fails despite correct behavior            |
| Endpoint deprecated/removed     | Tests reference dead code                           |

### Architecture

```text
┌─────────────────┐     ┌──────────────────┐
│  Old Swagger     │     │  New Swagger      │
│  (git: HEAD~1)   │     │  (git: HEAD)      │
└────────┬────────┘     └────────┬──────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
           ┌──────────────────┐
           │  Schema Differ    │
           │  (breaking changes)│
           └────────┬─────────┘
                    ▼
           ┌──────────────────┐
           │  Vector DB Query  │
           │  (affected tests) │
           └────────┬─────────┘
                    ▼
           ┌──────────────────┐
           │  LLM Migration    │
           │  Patch Generator  │
           └──────────────────┘
```

### Schema Differ

```ts
// src/rag/schema-differ.ts
export interface SchemaChange {
    type: 'added' | 'removed' | 'renamed' | 'type-changed' | 'path-changed';
    path: string;          // endpoint path
    field?: string;        // affected field
    oldValue?: string;
    newValue?: string;
    breaking: boolean;
}

export class SchemaDiffer {
    static diff(oldSpec: Record<string, unknown>, newSpec: Record<string, unknown>): SchemaChange[] {
        const changes: SchemaChange[] = [];

        const oldPaths = Object.keys((oldSpec as { paths?: Record<string, unknown> }).paths ?? {});
        const newPaths = Object.keys((newSpec as { paths?: Record<string, unknown> }).paths ?? {});

        // Detect removed endpoints
        for (const path of oldPaths) {
            if (!newPaths.includes(path)) {
                changes.push({ type: 'removed', path, breaking: true });
            }
        }

        // Detect added endpoints
        for (const path of newPaths) {
            if (!oldPaths.includes(path)) {
                changes.push({ type: 'added', path, breaking: false });
            }
        }

        // Deep field comparison would go here (request/response schema diffs)

        return changes;
    }
}
```

### Maintenance Pipeline

```ts
// src/rag/test-maintenance.ts
import Anthropic from '@anthropic-ai/sdk';

import { VectorIndex } from '../health/vector-index';
import { SchemaChange } from './schema-differ';

export class TestMaintenance {
    private anthropic: Anthropic;

    constructor(private vectorIndex: VectorIndex) {
        this.anthropic = new Anthropic();
    }

    async findAffectedTests(changes: SchemaChange[]): Promise<Map<string, SchemaChange[]>> {
        const affected = new Map<string, SchemaChange[]>();

        for (const change of changes) {
            const results = await this.vectorIndex.findSimilar(
                `${change.path} ${change.field ?? ''}`, 10
            );

            for (const result of results.filter((r) => r.distance < 0.4)) {
                const existing = affected.get(result.metadata.filePath) ?? [];
                existing.push(change);
                affected.set(result.metadata.filePath, existing);
            }
        }

        return affected;
    }

    async suggestMigration(
        testContent: string,
        changes: SchemaChange[]
    ): Promise<string> {
        const changeDescription = changes
            .map((c) => `- ${c.type}: ${c.path}${c.field ? '.' + c.field : ''} ` +
                        `${c.oldValue ? `(was: ${c.oldValue})` : ''} ` +
                        `${c.newValue ? `(now: ${c.newValue})` : ''}`)
            .join('\n');

        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: `An API schema changed. Update this test file to match.

Schema changes:
${changeDescription}

Current test file:
${testContent}

Rules:
- Keep the same test structure and assertions where possible
- Update type references, endpoint paths, field names as needed
- Add tests for new required fields if applicable
- Remove tests for deleted endpoints

Return ONLY the updated TypeScript file content.`,
            }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    }
}
```

### Workflow

```text
1. Detect       npm run rag:diff             Compare old vs new Swagger spec
2. Find impact  npm run rag:affected         Query vector DB for affected tests
3. Migrate      npm run rag:migrate          LLM generates migration patches
4. Review       Developer reviews patches    Always human-in-the-loop
5. Verify       npx playwright test          Run updated tests
```

---

## 3. Testing RAG Applications

Write API tests for applications that use RAG — vector search endpoints, embedding APIs, and retrieval-augmented
responses.

### Challenges

| Challenge                     | Why it's hard                                           |
| ----------------------------- | ------------------------------------------------------- |
| Non-deterministic responses   | LLM output varies across runs                           |
| Relevance scoring             | "Good enough" retrieval is subjective                   |
| Embedding drift               | Model updates change similarity scores                  |
| Context window sensitivity    | Retrieved chunk order affects generation quality         |
| Ground truth maintenance      | Expected answers change as the knowledge base evolves    |

### Test Categories

#### 3.1 Retrieval Quality Tests

Test that the retrieval component returns relevant documents.

```ts
import { expect, test } from '@fixtures/fixtures';
import { StatusCodes } from 'http-status-codes';

test.describe('RAG - Retrieval Quality', () => {
    test('should return relevant documents for a known query', async ({ ragService }) => {
        ragService.setToken(token);

        const { statusCode, data } = await ragService.search({
            query: 'How to reset password',
            topK: 5,
        });

        expect(statusCode).toBe(StatusCodes.OK);
        expect(data.results.length).toBeGreaterThanOrEqual(1);

        // At least one result should be from the auth documentation
        const hasAuthDoc = data.results.some(
            (r) => r.metadata.category === 'authentication'
        );
        expect(hasAuthDoc).toBe(true);
    });

    test('should rank exact-match documents higher', async ({ ragService }) => {
        ragService.setToken(token);

        const { data } = await ragService.search({
            query: 'password reset flow',
            topK: 10,
        });

        const topResult = data.results[0];
        expect(topResult.score).toBeGreaterThan(0.8);
        expect(topResult.metadata.title).toContain('password');
    });
});
```

#### 3.2 Generation Quality Tests

Test that the RAG-augmented LLM response is grounded in retrieved context.

```ts
test.describe('RAG - Generation Quality', () => {
    test('should generate answer grounded in retrieved context', async ({ ragService }) => {
        ragService.setToken(token);

        const { statusCode, data } = await ragService.ask({
            question: 'What are the password requirements?',
        });

        expect(statusCode).toBe(StatusCodes.OK);

        // Response should contain specific facts from the knowledge base
        expect(data.answer).toContain('8 characters');
        expect(data.sources.length).toBeGreaterThan(0);

        // No hallucination — answer references only provided sources
        for (const source of data.sources) {
            expect(source.documentId).toBeTruthy();
        }
    });

    test('should return "I don\'t know" for out-of-scope questions', async ({ ragService }) => {
        ragService.setToken(token);

        const { data } = await ragService.ask({
            question: 'What is the meaning of life?',
        });

        expect(data.answer).toMatch(/don't know|not sure|no information|outside.*scope/i);
    });
});
```

#### 3.3 Embedding Endpoint Tests

Test the embedding API for consistency and correctness.

```ts
test.describe('RAG - Embeddings', () => {
    test('should return embeddings with correct dimensions', async ({ embeddingService }) => {
        embeddingService.setToken(token);

        const { statusCode, data } = await embeddingService.embed({
            text: 'sample document for embedding',
        });

        expect(statusCode).toBe(StatusCodes.OK);
        expect(data.embedding).toHaveLength(768); // dimension depends on model
        expect(data.embedding.every((v) => typeof v === 'number')).toBe(true);
    });

    test('should produce similar embeddings for similar texts', async ({ embeddingService }) => {
        embeddingService.setToken(token);

        const { data: emb1 } = await embeddingService.embed({ text: 'reset my password' });
        const { data: emb2 } = await embeddingService.embed({ text: 'change my password' });
        const { data: emb3 } = await embeddingService.embed({ text: 'order a pizza' });

        const sim12 = cosineSimilarity(emb1.embedding, emb2.embedding);
        const sim13 = cosineSimilarity(emb1.embedding, emb3.embedding);

        expect(sim12).toBeGreaterThan(sim13);
    });
});

function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (magA * magB);
}
```

#### 3.4 Ingestion Pipeline Tests

Test that documents are correctly chunked, embedded, and stored.

```ts
test.describe('RAG - Ingestion', () => {
    test('should ingest document and make it searchable', async ({ ragService }) => {
        ragService.setToken(token);

        // Ingest
        const { statusCode: ingestStatus } = await ragService.ingest({
            title: 'Test Document',
            content: 'This document contains unique-test-phrase-12345 for verification.',
            metadata: { category: 'test' },
        });
        expect(ingestStatus).toBe(StatusCodes.CREATED);

        // Search — allow time for async indexing if applicable
        const { data } = await ragService.search({
            query: 'unique-test-phrase-12345',
            topK: 1,
        });

        expect(data.results[0].metadata.title).toBe('Test Document');
    });

    test('should chunk large documents correctly', async ({ ragService }) => {
        ragService.setToken(token);

        const largeContent = 'paragraph '.repeat(5000);

        const { statusCode, data } = await ragService.ingest({
            title: 'Large Document',
            content: largeContent,
            metadata: { category: 'test' },
        });

        expect(statusCode).toBe(StatusCodes.CREATED);
        expect(data.chunksCreated).toBeGreaterThan(1);
    });
});
```

### Service Pattern for RAG Endpoints

```ts
// src/services/rag.service.ts
import { type ServiceResponse } from '@models/requests/request.type';
import { BaseService } from '@services/base.service';

export class RagService extends BaseService {
    constructor() {
        super('/rag');
    }

    async search(body: SearchRequest): Promise<ServiceResponse<SearchResponse>> {
        return await this.send<SearchResponse>('post', {
            url: this.endpoint('/search'),
            body,
        });
    }

    async ask(body: AskRequest): Promise<ServiceResponse<AskResponse>> {
        return await this.send<AskResponse>('post', {
            url: this.endpoint('/ask'),
            body,
        });
    }

    async ingest(body: IngestRequest): Promise<ServiceResponse<IngestResponse>> {
        return await this.send<IngestResponse>('post', {
            url: this.endpoint('/ingest'),
            body,
        });
    }
}
```

---

## 4. RAG-Assisted Debugging

When API tests fail, use RAG to retrieve relevant logs, documentation, and similar past failures to accelerate
diagnosis.

### Architecture

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Test Failure     │     │  API Docs         │     │  Historical      │
│  (error + trace)  │     │  (Swagger / wiki) │     │  Failures        │
└────────┬─────────┘     └────────┬──────────┘     └────────┬─────────┘
         │                        │                          │
         └────────────────┬───────┴──────────────────────────┘
                          ▼
                ┌──────────────────┐
                │  Vector DB Query │
                └────────┬─────────┘
                         ▼
                ┌──────────────────┐
                │  LLM Diagnosis   │
                │  + Fix Suggest   │
                └──────────────────┘
```

### What Gets Indexed for Debugging

| Source                    | Content                                              |
| ------------------------- | ---------------------------------------------------- |
| Past test failures        | Error message + stack trace + test name              |
| Past fixes                | Git commit message + diff for failure-fixing commits |
| API documentation         | Endpoint descriptions, error codes, rate limits      |
| Known issues / workarounds| From `docs/troubleshooting/`                         |
| Service source code       | Method implementations for context                   |

### Debug Pipeline

```ts
// src/rag/debug-assistant.ts
import Anthropic from '@anthropic-ai/sdk';

import { VectorIndex } from '../health/vector-index';

export interface DebugContext {
    testName: string;
    errorMessage: string;
    stackTrace: string;
    endpoint?: string;
    statusCode?: number;
    responseBody?: string;
}

export class DebugAssistant {
    private anthropic: Anthropic;

    constructor(private vectorIndex: VectorIndex) {
        this.anthropic = new Anthropic();
    }

    async diagnose(context: DebugContext): Promise<{
        rootCause: string;
        suggestion: string;
        similarFailures: Array<{ test: string; resolution: string }>;
    }> {
        // 1. Find similar past failures
        const similarFailures = await this.vectorIndex.findSimilar(
            `${context.errorMessage} ${context.endpoint ?? ''}`, 5
        );

        // 2. Find relevant API docs
        const apiDocs = await this.vectorIndex.findSimilar(
            `endpoint ${context.endpoint} error ${context.statusCode}`, 3
        );

        // 3. Find troubleshooting guides
        const troubleshooting = await this.vectorIndex.findSimilar(
            `troubleshoot ${context.errorMessage}`, 3
        );

        const retrievedContext = [
            '## Similar past failures',
            ...similarFailures.map((f) => `- ${f.document}`),
            '## API documentation',
            ...apiDocs.map((d) => d.document),
            '## Troubleshooting guides',
            ...troubleshooting.map((t) => t.document),
        ].join('\n');

        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `An API test failed. Diagnose the root cause.

Test: ${context.testName}
Error: ${context.errorMessage}
Stack trace: ${context.stackTrace}
${context.endpoint ? `Endpoint: ${context.endpoint}` : ''}
${context.statusCode ? `Status code: ${context.statusCode}` : ''}
${context.responseBody ? `Response body: ${context.responseBody}` : ''}

Retrieved context:
${retrievedContext}

Return JSON:
{
    "rootCause": "one-line root cause",
    "suggestion": "specific fix steps",
    "confidence": 0.0-1.0
}`,
            }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const diagnosis = JSON.parse(text);

        return {
            rootCause: diagnosis.rootCause ?? 'Unknown',
            suggestion: diagnosis.suggestion ?? 'Manual investigation needed',
            similarFailures: similarFailures
                .filter((f) => f.distance < 0.3)
                .map((f) => ({
                    test: f.metadata.filePath ?? f.id,
                    resolution: f.metadata.resolution ?? 'See commit history',
                })),
        };
    }
}
```

### Playwright Reporter Integration

```ts
// src/rag/debug-reporter.ts
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

import { DebugAssistant, DebugContext } from './debug-assistant';
import { VectorIndex } from '../health/vector-index';

class DebugReporter implements Reporter {
    private failures: DebugContext[] = [];

    onTestEnd(test: TestCase, result: TestResult): void {
        if (result.status !== 'failed') return;

        this.failures.push({
            testName: test.title,
            errorMessage: result.error?.message ?? 'Unknown error',
            stackTrace: result.error?.stack ?? '',
        });
    }

    async onEnd(_result: FullResult): Promise<void> {
        if (this.failures.length === 0) return;

        const vectorIndex = new VectorIndex();
        await vectorIndex.initialize();
        const assistant = new DebugAssistant(vectorIndex);

        console.log('\n--- API Test Debug Report ---\n');

        for (const failure of this.failures) {
            const diagnosis = await assistant.diagnose(failure);
            console.log(`Test: ${failure.testName}`);
            console.log(`  Root cause: ${diagnosis.rootCause}`);
            console.log(`  Suggestion: ${diagnosis.suggestion}`);
            if (diagnosis.similarFailures.length > 0) {
                console.log('  Similar past failures:');
                for (const sf of diagnosis.similarFailures) {
                    console.log(`    - ${sf.test}: ${sf.resolution}`);
                }
            }
            console.log('');
        }
    }
}

export default DebugReporter;
```

---

## Directory Structure

```text
src/rag/
├── api-test-generator.ts    # RAG-powered test generation
├── schema-differ.ts         # Swagger spec diff detection
├── test-maintenance.ts      # Find affected tests + suggest migrations
├── debug-assistant.ts       # RAG-assisted failure diagnosis
└── debug-reporter.ts        # Playwright reporter for debug output
```

## npm Scripts

```json
{
    "scripts": {
        "rag:index": "ts-node src/rag/indexer.ts",
        "rag:generate": "ts-node src/rag/api-test-generator.ts",
        "rag:diff": "ts-node src/rag/schema-differ.ts",
        "rag:affected": "ts-node src/rag/test-maintenance.ts --affected",
        "rag:migrate": "ts-node src/rag/test-maintenance.ts --migrate",
        "rag:debug": "ts-node src/rag/debug-assistant.ts"
    }
}
```

## Technology Stack

| Component         | Choice                          | Rationale                                     |
| ----------------- | ------------------------------- | --------------------------------------------- |
| Vector DB         | ChromaDB                        | Same as health-locator; zero-config local dev  |
| Embedding model   | `all-MiniLM-L6-v2`             | Fast, local, no API key needed                |
| LLM               | Claude (Anthropic API)          | Best code understanding for test generation   |
| Schema diffing    | Custom TypeScript               | Lightweight, no extra dependencies            |
| Reporter          | Playwright custom reporter      | Native integration, no extra tooling          |

## Configuration

| Variable                | Default           | Description                              |
| ----------------------- | ----------------- | ---------------------------------------- |
| `RAG_DB_PATH`           | `./.rag-db`       | ChromaDB storage for API test RAG        |
| `RAG_SIMILARITY`        | `0.4`             | Distance threshold for relevant matches  |
| `ANTHROPIC_API_KEY`     | —                 | Required for LLM-powered features        |
| `RAG_TOP_K`             | `5`               | Number of retrieved results per query    |
| `SWAGGER_SPEC_PATH`     | `./swagger.json`  | Path to OpenAPI spec for diff/generation |

## Implementation Priority

Recommended adoption order:

1. **Test generation** (highest ROI) — reduces boilerplate when onboarding new API modules
2. **Debugging assistance** — saves triage time on CI failures
3. **Test maintenance** — valuable after the first major API version bump
4. **Testing RAG apps** — only when the product under test uses RAG

## Limitations

- LLM-generated tests must always be reviewed — they may miss edge cases or invent invalid assertions
- Schema diffing covers structural changes; semantic changes (e.g. "status 1 now means inactive") need human judgment
- Vector similarity for code/API content is less precise than for natural language — tune thresholds per project
- ChromaDB in-process is single-threaded; for parallel CI jobs, use a shared Milvus or Pinecone instance
- Debug assistant works best when historical failure data is rich — cold start has limited value

## Related

- [Health Locator with RAG](./health-locator-rag.md) — locator-focused RAG (same vector DB infrastructure)
- [Write API Test Skill](../../.claude/skills/write-api-test.md)
- [Create API Service Skill](../../.claude/skills/create-api-service.md)
- [Create Service from Swagger Skill](../../.claude/skills/create-service-from-swagger.md)
