# Multiple Sections Container Pattern

Use this pattern when a page has multiple repeated or dynamic sections, and elements like inputs depend on the selected
section.

## Rule

-   Define stable elements in the constructor.
-   Create dynamic or section-dependent elements through methods/factories.
-   Do not use singleton for section containers.

## Structure

```text
src/components/containers/profile/
├── header.container.ts
├── main.container.ts
├── form-section.container.ts
└── footer.container.ts
```

## Section Container

```ts
import { Form } from '@components/form.component';
import { Input } from '@elements/common/input';
import { Locator } from '@playwright/test';

export class FormSectionContainer {
    private readonly form: Form;

    constructor(private readonly container: Locator) {
        this.form = new Form(this.container);
    }

    getInput(option: { label?: string; placeholder?: string; id?: string }): Input {
        return this.form.getInput(option);
    }

    async fillInput(label: string, value: string): Promise<void> {
        await this.getInput({ label }).fill(value);
    }
}
```

## Main Container Factory

```ts
import { $ } from '@common/element.function';
import { Locator } from '@playwright/test';
import { FormSectionContainer } from './form-section.container';

export class ProfileMainContainer {
    private readonly container: Locator;

    constructor() {
        this.container = $('.profile-main');
    }

    getSection(sectionName: string): FormSectionContainer {
        const section = this.container.locator('section', {
            hasText: sectionName
        });

        return new FormSectionContainer(section);
    }
}
```

## Page Object Business Methods

```ts
export class ProfilePage {
    readonly main: ProfileMainContainer;

    async updatePersonalInfo(data: { firstName: string; lastName: string }): Promise<void> {
        const section = this.main.getSection('Personal Information');

        await section.fillInput('First Name', data.firstName);
        await section.fillInput('Last Name', data.lastName);
    }
}
```

## Why Not Singleton?

Section containers should not be singleton because each instance has a different scoped parent locator.

Singleton would cause:

-   Wrong section being used
-   Shared state bugs
-   Flaky tests
-   Harder debugging

Use singleton only for global UI/services, such as `BrowserInstance` or global notification.

## Benefits

-   YAGNI: inputs are created only when needed
-   KISS: constructors stay small
-   DRY: one reusable section container
-   SOLID: page object, main container, and section container each have one responsibility
