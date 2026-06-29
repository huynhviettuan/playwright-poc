# PDF Testing

## When to Use

Use the PDF testing utilities when your test needs to:

-   Verify a downloaded PDF contains expected text or metadata
-   Compare a generated PDF visually against a baseline snapshot
-   Fill and submit PDF forms
-   Validate PDF responses from API endpoints

## `PdfHelper` API

### Opening a PDF

```ts
import { PdfHelper } from '@helpers/services/pdf.helper';

// From downloads folder (after clicking a download button)
const pdf = PdfHelper.open('report.pdf');

// From a Buffer (e.g., API response body)
const pdf = PdfHelper.fromBuffer(responseBuffer);

// From an absolute path
const pdf = PdfHelper.fromPath('/path/to/file.pdf');
```

### Text Extraction

```ts
const allText = await pdf.getText();
const pageText = await pdf.getTextFromPage(2); // 1-based page number
```

### Metadata

```ts
const metadata = await pdf.getMetadata();
// { title, author, pageCount, creationDate }

const pages = await pdf.getPageCount();
```

### Visual Comparison

Convert a PDF page to a PNG image buffer for snapshot testing:

```ts
const imageBuffer = await pdf.getPageAsImage(1); // page 1, scale 2x

// Use with Playwright's snapshot matcher
expect(imageBuffer).toMatchSnapshot('report-page1.png');
```

### Table Extraction

```ts
// Get all tables from the PDF (each table is a string[][])
const tables = await pdf.getTables();
// tables[0] = [['Name', 'Age'], ['Alice', '30'], ['Bob', '25']]

// Get tables from a specific page
const pageTables = await pdf.getTablesFromPage(2);

// Get a table as JSON (uses first row as headers)
const rows = await pdf.getTableAsJson();
// [{ Name: 'Alice', Age: '30' }, { Name: 'Bob', Age: '25' }]

// Get a specific table by index from a specific page
const rows = await pdf.getTableAsJson(1, 3); // 2nd table on page 3
```

### Form Operations

```ts
// Read form fields
const fields = await pdf.getFormFields();
// [{ name: 'firstName', type: 'text', value: '' }, ...]

// Fill form and get new PDF buffer
const filledBuffer = await pdf.fillForm({
    firstName: 'John',
    lastName: 'Doe',
    agreeTerms: 'true' // checkbox
});

// Save the filled PDF
await pdf.save('src/downloads/filled-form.pdf');
```

## Fixtures

### `downloadPdf(trigger)`

Clicks a `Clickable` element, waits for the download event, saves the file, and returns a `PdfHelper`.

```ts
import { expect, test } from '@fixtures/fixtures';

test('downloaded report has correct content', async ({ downloadPdf, reportsPage }) => {
    const pdf = await downloadPdf(reportsPage.main.btnExportPdf);

    await expect(pdf).toContainPdfText('Monthly Revenue');
    await expect(pdf).toHavePdfPageCount(3);
});
```

### `getPdfFromResponse(url)`

Intercepts a network response matching a URL pattern and returns a `PdfHelper` from the response body.

```ts
test('API-generated invoice is valid', async ({ getPdfFromResponse }) => {
    // Trigger the action that generates the PDF
    await invoicePage.main.btnGenerate.click();

    const pdf = await getPdfFromResponse(/\/api\/invoices\/.*\.pdf/);
    await expect(pdf).toContainPdfText('Invoice #12345');
});
```

## Custom Matchers

| Matcher                      | Input       | Assertion                             |
| ---------------------------- | ----------- | ------------------------------------- |
| `toContainPdfText(expected)` | `PdfHelper` | PDF text contains the expected string |
| `toHavePdfPageCount(count)`  | `PdfHelper` | PDF has exactly N pages               |

```ts
await expect(pdf).toContainPdfText('Order Summary');
await expect(pdf).toHavePdfPageCount(5);
```

## Visual Snapshot Workflow

1. First run generates baseline: `npx playwright test --update-snapshots`
2. Subsequent runs compare against baseline
3. Review diffs in Playwright's HTML report

```ts
test('invoice layout matches baseline', async ({ downloadPdf, invoicePage }) => {
    const pdf = await downloadPdf(invoicePage.main.btnDownload);
    const image = await pdf.getPageAsImage(1);

    expect(image).toMatchSnapshot('invoice-page1.png', { maxDiffPixelRatio: 0.01 });
});
```

## In-Browser PDF Viewer

For PDFs displayed in an iframe viewer, extract the PDF URL and fetch it directly:

```ts
test('embedded PDF displays correctly', async ({ page, getPdfFromResponse }) => {
    const pdfFrame = page.frameLocator('iframe[src*=".pdf"]');
    const pdfUrl = await page.locator('iframe[src*=".pdf"]').getAttribute('src');

    const response = await page.request.get(pdfUrl);
    const pdf = PdfHelper.fromBuffer(await response.body());

    await expect(pdf).toContainPdfText('Terms and Conditions');
});
```

## Related

-   [ExcelHelper](../../src/helpers/services/excel.helper.ts) — similar pattern for Excel files
-   [expect guidance](../guidance/expect.md) — custom expect matchers
-   [Clickable.download()](../../src/elements/base/clickable.ts) — underlying download mechanism
