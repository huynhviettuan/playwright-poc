# Skill: Use Helper Functions

## When to Use
Use this skill when you need common utilities like data generation, validation, date/time operations, Excel handling, or API response processing.

## Available Helper Classes

### DateTimeHelper (`@helpers/date-time-functions`)

Powered by `date-fns`. Accepts moment-style format strings (e.g. `DD/MM/YYYY`) — they are
converted internally. Default format is `DD/MM/YYYY`.

```ts
import { DateTimeHelper } from '@helpers/date-time-functions';

DateTimeHelper.today()                          // Current date (DD/MM/YYYY)
DateTimeHelper.today('YYYY-MM-DD')              // Current date (custom format)
DateTimeHelper.addDays(7)                       // 7 days from now
DateTimeHelper.addDays(7, 'YYYY-MM-DD')         // 7 days from now (custom format)
DateTimeHelper.subtractDays(30)                 // 30 days ago
DateTimeHelper.todayUnix()                      // Current Unix timestamp
DateTimeHelper.toUnix('2024-01-01')             // Date to Unix
DateTimeHelper.fromUnix(1704067200)             // Unix to date
DateTimeHelper.endOfDayUnix('2024-01-01')       // End of day as Unix
DateTimeHelper.subtractDaysUnix(7)              // 7 days ago as Unix
DateTimeHelper.isValidFormat('01/01/2024', 'DD/MM/YYYY')
DateTimeHelper.getMonth('01/06/2024')           // '06'
DateTimeHelper.getYear('01/06/2024')            // '2024'
DateTimeHelper.randomTimestamp()                // Unique timestamp string
```

### ExcelHelper (`@helpers/excel.helper`)

Workbooks are cached after first load — repeated reads on the same instance are fast.
Call `invalidateCache()` after external writes if needed.

```ts
import { ExcelHelper } from '@helpers/excel.helper';

const excel = ExcelHelper.open('data.xlsx', 'Sheet1');
await excel.readCell('A1');
await excel.readCells(['A1', 'B1', 'C1']);
await excel.getRowAsJson(2);              // Row to JSON (header row = 1)
await excel.getRowsAsJson(2, 10);         // Multiple rows
await excel.getColumnAsJson('B');          // Column to JSON
await excel.getColumnsAsJson(['B', 'C']); // Multiple columns
await excel.writeCell(1, 'A', 'Value');
await excel.writeCells(1, [['A', 'Name'], ['B', 'Age']]);
await excel.getSheetNames();              // List all sheets
excel.withSheet('Sheet2');                 // Switch sheet
excel.invalidateCache();                   // Force reload from disk
```

### DataGenerator (`@helpers/generate-data-functions`)
```ts
import { DataGenerator } from '@helpers/generate-data-functions';

DataGenerator.randomString(10)
DataGenerator.randomNumber(1, 100)         // Uses faker.number.int()
DataGenerator.randomEmail('test')          // test+timestamp@gmail.com
DataGenerator.randomName()
DataGenerator.randomPhone()
DataGenerator.randomAddress()
```

### FileHelper (`@helpers/generate-data-functions`)
```ts
import { FileHelper } from '@helpers/generate-data-functions';

FileHelper.clone('file.xlsx', 'src/data', 'src/downloads');
FileHelper.exists('path/to/file');
FileHelper.delete('path/to/file');
```

### ArrayHelper (`@helpers/helper-functions`)
```ts
import { ArrayHelper } from '@helpers/helper-functions';

// Sequential execution (ordered)
await ArrayHelper.forEachSync(items, async (item, index) => {
    await processItem(item);
});

// Parallel execution (unordered)
await ArrayHelper.forEachAsync(items, async (item, index) => {
    await processItem(item);
});
```

### StringHelper (`@helpers/helper-functions`)
```ts
import { StringHelper } from '@helpers/helper-functions';

StringHelper.decodeHtml('&lt;div&gt;Test&lt;/div&gt;');
StringHelper.normalizeParams({ tags: ['a', 'b'] }); // { tags: 'a,b' }
```

### ResponseHelper (`@helpers/helper-functions`)

> **For API tests**: prefer `ServiceResponse<T>` from `send<T>()` — data is already typed.
> `ResponseHelper` is mainly for **E2E network synchronization** and **legacy code**.

| Method | Use when |
| --- | --- |
| `toJson<T>({ response })` | Parsing a legacy service response (`{ statusCode, response }`) |
| `interceptedToJson<T>(response)` | Parsing a browser-intercepted response (`Response`) |
| `waitFor(url, timeout?)` | Synchronizing on a network response triggered by a UI action |

```ts
import { ResponseHelper } from '@helpers/helper-functions';

// Browser-intercepted response → typed object
const data = await ResponseHelper.interceptedToJson<User>(response);
```

#### `ResponseHelper.waitFor` — synchronize on a network response

Most "click → page changes" assertions are racy: the click fires, the API responds,
the DOM updates — and the test asserts somewhere in the middle. `waitFor` lets you
gate the assertion on the actual network response, not on a timer.

```ts
// String pattern — auto-escaped, matches the URL as a substring
const response = await ResponseHelper.waitFor('/api/users', 5000);

// RegExp pattern — full control (e.g. dynamic ids, multiple endpoints)
const response = await ResponseHelper.waitFor(/\/api\/users\/\d+/, 5000);
```

##### ⚠️ Set up the wait BEFORE the action that triggers it

The wait must be registered before the request fires, otherwise the response is
missed. Use `Promise.all` to start both concurrently:

```ts
// ✅ CORRECT — both promises start; waitFor registers, then click fires the request
const [response] = await Promise.all([
    ResponseHelper.waitFor('/api/auth/signin'),
    signInPage.main.btnLogin.click()
]);

// ❌ WRONG — click fires the request, response has already arrived by the time
// waitFor registers, so it times out
await signInPage.main.btnLogin.click();
const response = await ResponseHelper.waitFor('/api/auth/signin'); // race
```

##### Pattern 1 — Gate an assertion on a real response

```ts
test('should redirect after sign-in', async ({ signInPage }) => {
    await signInPage.main.fillCredentials(email, password);

    const [response] = await Promise.all([
        ResponseHelper.waitFor('/user-organization/auth/signin'),
        signInPage.main.btnLogin.click()
    ]);

    expect(response.status()).toBe(200);
    await expect(BrowserInstance.currentPage).not.toHaveURL(/\/sign-in/);
});
```

##### Pattern 2 — Capture data from the response for the next step

```ts
const [response] = await Promise.all([
    ResponseHelper.waitFor('/user-organization/auth/signin'),
    signInPage.main.btnLogin.click()
]);

const body = await ResponseHelper.interceptedToJson<SignInResponse>(response);
expect(body.token).toBeTruthy();
```

##### When NOT to use `waitFor`

- **Pure UI assertions** (no network involved) — use `expect(element).toBeVisible()`.
- **API tests** — call the service directly via fixtures; `waitFor` is for E2E synchronization.
- **Long-running polls** — Playwright's `expect.poll()` is the right tool.

### FileWriter (`@helpers/helper-functions`)
```ts
import { FileWriter } from '@helpers/helper-functions';

await FileWriter.writeJson('output.json', jsonString);
```

### Schema Validation
```ts
import { validateJsonSchema } from '@helpers/validate-schema.helper';

// Validate against existing schema file (src/data/schemas/<path>/<name>_schema.json)
await validateJsonSchema('GET_users', 'users', responseData);

// Create schema from response, then validate
await validateJsonSchema('GET_users', 'users', responseData, true);
```

## Common Patterns

### Generate Test Data
```ts
const testUser = {
    name: DataGenerator.randomName(),
    email: DataGenerator.randomEmail('test'),
    phone: DataGenerator.randomPhone(),
    createdAt: DateTimeHelper.todayUnix()
};
```

### Process Excel Data
```ts
const rows = await ExcelHelper.open('users.xlsx', 'Sheet1')
    .getRowsAsJson(2, 50);

await ArrayHelper.forEachSync(rows, async (row) => {
    await createUser(row);
});
```
