# Helper Registry

Living summary of all helper classes. Update this file when creating, updating, or deleting a helper.

## Functions (`@helpers/functions`)

Pure utilities — no file I/O or external dependencies.

| Helper         | Class            | Path                                  | Purpose                                |
| -------------- | ---------------- | ------------------------------------- | -------------------------------------- |
| Date & Time    | `DateTimeHelper` | `@helpers/functions/date-time`        | Format, add/subtract, compare dates    |
| Data Generator | `DataGenerator`  | `@helpers/functions/data-generator`   | Random emails, names, numbers, strings |
| File           | `FileHelper`     | `@helpers/functions/data-generator`   | Clone, exists, delete files            |
| Array          | `ArrayHelper`    | `@helpers/functions/helper-functions` | Collection utilities, async forEach    |
| String         | `StringHelper`   | `@helpers/functions/helper-functions` | String manipulation, encoding          |
| Response       | `ResponseHelper` | `@helpers/functions/helper-functions` | API response parsing                   |
| File Writer    | `FileWriter`     | `@helpers/functions/helper-functions` | Write files to disk                    |

## Services (`@helpers/services`)

File/external resource helpers — depend on file I/O, databases, or external libraries.

| Helper            | Class                 | Path                                       | Purpose                                         |
| ----------------- | --------------------- | ------------------------------------------ | ----------------------------------------------- |
| Excel             | `ExcelHelper`         | `@helpers/services/excel.helper`           | Open, read/write cells, rows/columns as JSON    |
| PDF               | `PdfHelper`           | `@helpers/services/pdf.helper`             | Text, tables, metadata, forms, visual snapshots |
| Word              | `WordHelper`          | `@helpers/services/word.helper`            | Text, headings, tables, images, templates       |
| Database          | `DatabaseHelper`      | `@helpers/services/database.helper`        | Query, insert, delete for test data cleanup     |
| Schema Validation | `validateJsonSchema`  | `@helpers/services/validate-schema.helper` | JSON schema validation for API responses        |
| Accessibility     | `AccessibilityHelper` | `@helpers/services/accessibility.helper`   | Axe-core scans, violation reporting             |

## Test Data (`@helpers/test-data`)

Domain-specific data helpers — load JSON test data and provide typed access.

| Helper | Class                   | Path                 | Purpose                                    |
| ------ | ----------------------- | -------------------- | ------------------------------------------ |
| Base   | `BaseTestDataHelper<T>` | `@helpers/test-data` | Generic getAll, getById, findBy, filterBy  |
| Users  | `UserDataHelper`        | `@helpers/test-data` | getByRole, getByEmail, getAdmin, getActive |
