# Element Registry

Living summary of all UI elements. Update this file when creating, updating, or deleting an element.

## Base Classes

| Class         | Path                          | Extends     | Purpose                      |
| ------------- | ----------------------------- | ----------- | ---------------------------- |
| `BaseControl` | `@elements/base/base-control` | —           | Visibility, text, attributes |
| `Clickable`   | `@elements/base/clickable`    | BaseControl | Click, hover, download       |
| `Editable`    | `@elements/base/editable`     | BaseControl | Fill, clear, upload          |

## Common Elements

| Element            | Class               | Path                                  | Extends/Implements  | Key Methods                                       |
| ------------------ | ------------------- | ------------------------------------- | ------------------- | ------------------------------------------------- |
| Button             | `Button`            | `@elements/common/button`             | Clickable           | `click()`                                         |
| Checkbox           | `Checkbox`          | `@elements/common/checkbox`           | Clickable           | `check()`, `uncheck()`, `isChecked()`             |
| Date Picker        | `DatePicker`        | `@elements/common/date-picker`        | Clickable           | `selectDate()`                                    |
| Dropdown           | `Dropdown`          | `@elements/common/dropdown`           | ISelect             | `selectOption()`, `getOptions()`                  |
| Cascading Dropdown | `CascadingDropdown` | `@elements/common/cascading-dropdown` | Clickable + ISelect | `selectPath()`, `getOptions()`, `getSubOptions()` |
| Group Radio Button | `GroupRadioButton`  | `@elements/common/group-radio-button` | BaseControl         | `selectOption()`                                  |
| Image              | `Image`             | `@elements/common/image`              | BaseControl         | `getSrc()`, `getAlt()`                            |
| Input              | `Input`             | `@elements/common/input`              | Editable            | `fill()`, `clear()`, `getValue()`                 |
| Label              | `Label`             | `@elements/common/label`              | BaseControl         | `getText()`                                       |
| Link               | `Link`              | `@elements/common/link`               | Clickable           | `click()`, `getHref()`                            |
| Skeleton           | `Skeleton`          | `@elements/common/skeleton`           | BaseControl         | `waitForHidden()`                                 |
