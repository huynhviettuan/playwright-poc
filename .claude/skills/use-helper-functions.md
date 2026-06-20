# Skill: Use Helper Functions

## When to Use
Use this skill when you need common utilities like data generation, validation, date/time operations, Excel handling, or API response processing.

## Available Helper Classes

### DateTimeHelper (`@helpers/date-time-functions`)
```ts
import { DateTimeHelper } from '@helpers/date-time-functions';

DateTimeHelper.today()                    // Current date
DateTimeHelper.addDays(7, 'YYYY-MM-DD')  // Future date
DateTimeHelper.subtractDays(30)           // Past date
DateTimeHelper.todayUnix()                // Unix timestamp
DateTimeHelper.toUnix('2024-01-01')      // Date to Unix
DateTimeHelper.fromUnix(1704067200)       // Unix to date
DateTimeHelper.isValidFormat(date, 'DD/MM/YYYY')
DateTimeHelper.randomTimestamp()
```

### ExcelHelper (`@helpers/excel.helper`)
```ts
import { ExcelHelper } from '@helpers/excel.helper';

const excel = ExcelHelper.open('data.xlsx', 'Sheet1');
await excel.readCell('A1');
await excel.readCells(['A1', 'B1', 'C1']);
await excel.getRowAsJson(2);              // Row to JSON
await excel.getRowsAsJson(2, 10);         // Multiple rows
await excel.getColumnAsJson('B');         // Column to JSON
await excel.getColumnsAsJson(['B', 'C']); // Multiple columns
await excel.writeCell(1, 'A', 'Value');
await excel.writeCells(1, [['A', 'Name'], ['B', 'Age']]);
```

### DataGenerator (`@helpers/generate-data-functions`)
```ts
import { DataGenerator } from '@helpers/generate-data-functions';

DataGenerator.randomString(10)
DataGenerator.randomNumber(1, 100)
DataGenerator.randomEmail('test')         // test+timestamp@gmail.com
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

// Sequential execution
await ArrayHelper.forEachSync(items, async (item, index) => {
    await processItem(item);
});

// Parallel execution
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

Three responsibilities — one per method:

| Method                                       | Use when                                                          |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `toJson<T>({ response })`                    | Parsing an **API call** response from a service (`APIResponse`)   |
| `interceptedToJson<T>(response)`             | Parsing a **browser-intercepted** response (`Response`)           |
| `waitFor(url, timeout?)`                     | Synchronizing on a network response triggered by a UI action      |

```ts
import { ResponseHelper } from '@helpers/helper-functions';

// API service response → typed object
const user = await ResponseHelper.toJson<User>(await userService.getUser(token, id));

// Browser-intercepted response → typed object (use with waitFor below)
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
const response = await ResponseHelper.waitFor(/\.(json|xml)$/, 5000);
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

Use when the assertion depends on something the network call produced (a redirect,
a toast, a new row appearing).

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

Use when the test needs an id, token, or other field returned by the API to
proceed with later steps.

```ts
test('should sign in and use the issued token', async ({ signInPage }) => {
    await signInPage.main.fillCredentials(email, password);

    const [response] = await Promise.all([
        ResponseHelper.waitFor('/user-organization/auth/signin'),
        signInPage.main.btnLogin.click()
    ]);

    const body = await ResponseHelper.interceptedToJson<SignInResponse>(response);
    expect(body.token).toBeTruthy();

    // Use `body.token` for follow-up API calls, set up auth state, etc.
});
```

##### Pattern 3 — Wait for a refresh response after an action

Use when an action (delete, save) triggers a follow-up GET, and the next assertion
depends on the refreshed list/data.

```ts
test('should remove user from list after delete', async ({ usersPage }) => {
    await usersPage.main.openDeleteDialog(userEmail);

    const [refreshResponse] = await Promise.all([
        ResponseHelper.waitFor(/\/api\/users(\?|$)/),
        usersPage.modal.confirmDelete()
    ]);

    expect(refreshResponse.status()).toBe(200);
    await expect(await usersPage.main.getUserByEmail(userEmail)).toBeHidden();
});
```

##### Pattern 4 — Negative path (API rejects)

`waitFor` doesn't care about status code — it resolves on any matching response.
Use this to assert error paths reliably.

```ts
const [response] = await Promise.all([
    ResponseHelper.waitFor('/user-organization/auth/signin'),
    signInPage.signIn(email, 'wrong-password')
]);

expect(response.status()).toBe(401);
expect(await signInPage.toast.getMessage()).toContain(NotificationMessages.auth.loginFailed);
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
import { validateSchema } from '@helpers/validate-schema.helper';

const isValid = await validateSchema(responseData, expectedSchema);
expect(isValid).toBeTruthy();
```

## Common Patterns

### Parallel Assertions
```ts
import { resolveAll } from '@helpers/helper-functions';

await resolveAll([
    expect(await element1.isVisible()).toBeTruthy(),
    expect(await element2.getTextContent()).toEqual('text')
]);
```

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
    .getRowsAsJson(2, 50); // Rows 2-50 with row 1 as headers

await ArrayHelper.forEachSync(rows, async (row) => {
    await createUser(row);
});
```
