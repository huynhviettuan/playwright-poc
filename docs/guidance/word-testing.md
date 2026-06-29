# Word Document Testing

## When to Use

Use the Word testing utilities when your test needs to:

-   Verify a downloaded .docx contains expected text, headings, or tables
-   Validate document structure (images, metadata)
-   Fill templates with placeholders and verify output
-   Validate .docx responses from API endpoints

## `WordHelper` API

### Opening a Document

```ts
import { WordHelper } from '@helpers/services/word.helper';

// From downloads folder
const doc = WordHelper.open('report.docx');

// From a Buffer (e.g., API response)
const doc = WordHelper.fromBuffer(responseBuffer);

// From an absolute path
const doc = WordHelper.fromPath('/path/to/file.docx');
```

### Text Extraction

```ts
const plainText = await doc.getText();
const html = await doc.getHtml(); // full HTML conversion
```

### Headings

```ts
const headings = await doc.getHeadings();
// [{ level: 1, text: 'Introduction' }, { level: 2, text: 'Background' }]
```

### Tables

```ts
// Get all tables (headers + rows)
const tables = await doc.getTables();
// [{ headers: ['Name', 'Age'], rows: [['Alice', '30'], ['Bob', '25']] }]

// Get a table as JSON (uses headers as keys)
const rows = await doc.getTableAsJson(0);
// [{ Name: 'Alice', Age: '30' }, { Name: 'Bob', Age: '25' }]
```

### Images

```ts
const images = await doc.getImages();
// [{ contentType: 'image/png', buffer: <Buffer>, altText: undefined }]

// Save an image for visual comparison
expect(images[0].buffer).toMatchSnapshot('logo.png');
```

### Metadata

```ts
const meta = await doc.getMetadata();
// { title, author, description, createdAt, modifiedAt }
```

### Template Filling (Placeholder Replacement)

Replace `{{placeholder}}` patterns in the document:

```ts
const filled = await doc.replacePlaceholders({
    '{{name}}': 'John Doe',
    '{{date}}': '2026-06-29',
    '{{company}}': 'Acme Corp'
});

// Save the filled document
doc.save('src/downloads/filled-report.docx');

// Or verify the filled content
const filledDoc = WordHelper.fromBuffer(filled);
const text = await filledDoc.getText();
expect(text).toContain('John Doe');
```

## Fixtures

### `downloadWord(trigger)`

Clicks a `Clickable` element, waits for download, returns a `WordHelper`.

```ts
import { expect, test } from '@fixtures/fixtures';

test('exported report has correct content', async ({ downloadWord, reportsPage }) => {
    const doc = await downloadWord(reportsPage.main.btnExportDocx);

    await expect(doc).toContainWordText('Monthly Report');
    await expect(doc).toHaveWordHeading('Executive Summary');
    await expect(doc).toHaveWordTableCount(2);
});
```

### `getWordFromResponse(url)`

Intercepts a network response and returns a `WordHelper`.

```ts
test('API-generated contract is valid', async ({ getWordFromResponse }) => {
    await contractPage.main.btnGenerate.click();

    const doc = await getWordFromResponse(/\/api\/contracts\/.*\.docx/);
    await expect(doc).toContainWordText('Service Agreement');
});
```

## Custom Matchers

| Matcher                       | Input        | Assertion                       |
| ----------------------------- | ------------ | ------------------------------- |
| `toContainWordText(expected)` | `WordHelper` | Document text contains string   |
| `toHaveWordHeading(expected)` | `WordHelper` | Document has a matching heading |
| `toHaveWordTableCount(count)` | `WordHelper` | Document has exactly N tables   |

## Related

-   [PdfHelper](../../src/helpers/services/pdf.helper.ts) — similar pattern for PDF files
-   [ExcelHelper](../../src/helpers/services/excel.helper.ts) — similar pattern for Excel files
-   [pdf-testing guidance](pdf-testing.md) — PDF testing patterns
