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
```ts
import { ResponseHelper } from '@helpers/helper-functions';

const data = await ResponseHelper.toJson<User>(apiResponse);
const intercepted = await ResponseHelper.interceptedToJson(response);

// Wait for response - String pattern (auto-escaped)
const response = await ResponseHelper.waitFor('/api/users', 5000);

// Wait for response - RegExp pattern (full control)
const response2 = await ResponseHelper.waitFor(/\/api\/users\/\d+/, 5000);
const response3 = await ResponseHelper.waitFor(/\.(json|xml)$/, 5000);
```

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
