# Skill: Create Page Object

## When to Use
Use this skill when creating a new page object for E2E testing.

## Critical Rules

### ✅ Follow Frontend Structure
- **Container-Based Architecture**: Mirror frontend design (Header, Main, Footer)
- **Separation of Concerns**: Create containers first, then compose page objects
- **Single Responsibility**: Each container handles its own section

### ✅ Follow SOLID Principles
- **Single Responsibility**: One container per UI section
- **Open/Closed**: Extend containers without modifying them
- **Dependency Inversion**: Page objects depend on container abstractions

### ✅ Clean Code Practices
- Use descriptive element names (e.g., `btnSubmit`, `txtEmail`)
- Keep constructors clean - only element initialization
- Extract complex logic into methods
- Use readonly for public elements

## Container-Based Architecture

### Step 1: Create Containers
Create container components in `src/components/containers/[page-name]/`

**Example Structure:**
```
src/components/containers/sign-in/
├── header.container.ts
├── main.container.ts
└── footer.container.ts
```

### Step 2: Implement Container Classes

**Header Container** (`src/components/containers/sign-in/header.container.ts`):
```ts
import { $ } from '@common/element.function';
import { Label } from '@elements/common/label';
import { Link } from '@elements/common/link';
import { Locator } from '@playwright/test';

export class SignInHeaderContainer {
    private readonly container: Locator;
    
    readonly lblTitle: Label;
    readonly lnkLogo: Link;
    
    constructor() {
        this.container = $('.sign-in-header');
        this.lblTitle = new Label(this.container.locator('h1'));
        this.lnkLogo = new Link({ parentLocator: this.container, label: 'Logo' });
    }
}
```

**Main Container** (`src/components/containers/sign-in/main.container.ts`):
```ts
import { $ } from '@common/element.function';
import { Form } from '@components/form.component';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Link } from '@elements/common/link';
import { Locator } from '@playwright/test';

export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;
    
    readonly txtEmail: Input;
    readonly txtPassword: Input;
    readonly btnLogin: Button;
    readonly lnkForgotPassword: Link;
    
    constructor() {
        this.container = $('.sign-in-main');
        this.form = new Form(this.container);
        
        this.txtEmail = this.form.getInput({ label: 'Email address' });
        this.txtPassword = this.form.getInput({ label: 'Password' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });
        
        this.lnkForgotPassword = new Link({
            parentLocator: this.container,
            label: 'Forgot password?'
        });
    }
    
    async fillCredentials(email: string, password: string): Promise<void> {
        await this.txtEmail.fill(email);
        await this.txtPassword.fill(password);
    }
}
```

**Main Container with Table** (`src/components/containers/users/main.container.ts`):
```ts
import { $ } from '@common/element.function';
import { Table } from '@components/table.component';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Locator } from '@playwright/test';

export class UsersMainContainer {
    private readonly container: Locator;
    
    readonly txtSearch: Input;
    readonly btnAddUser: Button;
    readonly tblUsers: Table;
    
    constructor() {
        this.container = $('.users-main');
        
        this.txtSearch = new Input({
            parentLocator: this.container,
            placeholder: 'Search users...'
        });
        
        this.btnAddUser = new Button({
            parentLocator: this.container,
            label: 'Add User'
        });
        
        this.tblUsers = new Table(this.container.locator('table'));
    }
    
    async searchUser(query: string): Promise<void> {
        await this.txtSearch.fill(query);
    }
    
    async getUserRow(userName: string): Promise<Locator> {
        return await this.tblUsers.getRowWithData({ Name: userName });
    }
}
```

### Multiple Dynamic Sections Pattern

Use this pattern when one page/container has repeated or dynamic sections, and inputs depend on which section is selected.

**Rule:** Define stable elements in the constructor. Create section-dependent elements through factory methods.

**Do not use singleton for section containers.** Each section container needs its own scoped `Locator`.

**Example Structure:**
```text
src/components/containers/profile/
├── header.container.ts
├── main.container.ts
├── form-section.container.ts
└── footer.container.ts
```

**Section Container** (`src/components/containers/profile/form-section.container.ts`):
```ts
import { Form } from '@components/form.component';
import { Button } from '@elements/common/button';
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

    getButton(option: { label?: string; index?: number }): Button {
        return this.form.getButton(option);
    }

    async fillInput(label: string, value: string): Promise<void> {
        await this.getInput({ label }).fill(value);
    }
}
```

**Main Container with Section Factory** (`src/components/containers/profile/main.container.ts`):
```ts
import { $ } from '@common/element.function';
import { Button } from '@elements/common/button';
import { Locator } from '@playwright/test';
import { FormSectionContainer } from './form-section.container';

export class ProfileMainContainer {
    private readonly container: Locator;

    readonly btnSave: Button;

    constructor() {
        this.container = $('.profile-main');
        this.btnSave = new Button({ parentLocator: this.container, label: 'Save' });
    }

    getSection(sectionName: string): FormSectionContainer {
        const section = this.container.locator('section', {
            hasText: sectionName
        });

        return new FormSectionContainer(section);
    }
}
```

**Page Object Hides Section Details** (`src/pages/profile/index.ts`):
```ts
export class ProfilePage {
    readonly main: ProfileMainContainer;

    constructor() {
        this.main = new ProfileMainContainer();
    }

    async updatePersonalInfo(data: { firstName: string; lastName: string }): Promise<void> {
        const section = this.main.getSection('Personal Information');

        await section.fillInput('First Name', data.firstName);
        await section.fillInput('Last Name', data.lastName);
        await this.main.btnSave.click();
    }

    async updateBillingAddress(data: { address: string; city: string }): Promise<void> {
        const section = this.main.getSection('Billing Address');

        await section.fillInput('Address', data.address);
        await section.fillInput('City', data.city);
        await this.main.btnSave.click();
    }
}
```

**Usage:**
```ts
await profilePage.updatePersonalInfo({
    firstName: 'John',
    lastName: 'Doe'
});

await profilePage.updateBillingAddress({
    address: '123 Main Street',
    city: 'New York'
});
```

**Why not singleton?**
- Each section has a different parent locator.
- Singleton would share state between sections.
- Shared locator state can cause flaky tests and hard debugging.
- Section containers represent repeated UI, so they should be normal instances.

**Use singleton only for global UI/services**, like `BrowserInstance` or global notification.

**Footer Container** (`src/components/containers/sign-in/footer.container.ts`):
```ts
import { $ } from '@common/element.function';
import { Link } from '@elements/common/link';
import { Label } from '@elements/common/label';
import { Locator } from '@playwright/test';

export class SignInFooterContainer {
    private readonly container: Locator;
    
    readonly lblCopyright: Label;
    readonly lnkTerms: Link;
    readonly lnkPrivacy: Link;
    
    constructor() {
        this.container = $('.sign-in-footer');
        this.lblCopyright = new Label(this.container.locator('.copyright'));
        this.lnkTerms = new Link({ parentLocator: this.container, label: 'Terms' });
        this.lnkPrivacy = new Link({ parentLocator: this.container, label: 'Privacy' });
    }
}
```

### Step 3: Compose Page Object

**Page Object** (`src/pages/sign-in.page.ts`):
```ts
import { Config } from '@constants/config.constant';
import { SignInFooterContainer } from '@components/containers/sign-in/footer.container';
import { SignInHeaderContainer } from '@components/containers/sign-in/header.container';
import { SignInMainContainer } from '@components/containers/sign-in/main.container';

export class SignInPage {
    readonly header: SignInHeaderContainer;
    readonly main: SignInMainContainer;
    readonly footer: SignInFooterContainer;
    
    constructor() {
        this.header = new SignInHeaderContainer();
        this.main = new SignInMainContainer();
        this.footer = new SignInFooterContainer();
    }
    
    async signIn(email: string, password: string = Config.auth.password): Promise<void> {
        await this.main.fillCredentials(email, password);
        await this.main.btnLogin.click();
    }
    
    async goToForgotPassword(): Promise<void> {
        await this.main.lnkForgotPassword.click();
    }
    
    async getPageTitle(): Promise<string> {
        return await this.header.lblTitle.getTextContent();
    }
}
```

### Step 4: Register in Fixtures

**Fixture** (`src/fixtures/page-fixtures.ts`):
```ts
import { SignInPage } from '@pages/sign-in.page';
import { test as base } from '@playwright/test';

type PageObjects = {
    signInPage: SignInPage;
};

export const test = base.extend<PageObjects>({
    signInPage: async ({}, use) => {
        await use(new SignInPage());
    }
});
```

## Usage in Tests

```ts
import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Sign In', () => {
    test.beforeEach(async () => {
        await BrowserInstance.currentPage.goto(Endpoints.auth.signIn);
    });
    
    test('should sign in successfully', async ({ signInPage }) => {
        // Using composed containers
        await signInPage.signIn('user@example.com');
        
        // ✅ Custom expect matchers - work directly with elements
        await expect(signInPage.main.btnLogin).toBeVisible();
        await expect(signInPage.header.lblTitle).toHaveText('Sign In');
        
        // ❌ Old way - had to use .element
        // await expect(signInPage.main.btnLogin.element).toBeVisible();
    });
    
    test('should navigate to forgot password', async ({ signInPage }) => {
        await signInPage.goToForgotPassword();
    });
});
```

## Benefits of Container-Based Approach

### ✅ SOLID Compliance
- **Single Responsibility**: Each container manages one UI section
- **Open/Closed**: Add new containers without modifying existing ones
- **Dependency Inversion**: Page objects depend on container abstractions

### ✅ Maintainability
- Changes to header affect only `header.container.ts`
- Reusable containers across multiple pages
- Clear structure mirrors frontend architecture

### ✅ Testability
- Test containers independently if needed
- Easy to mock specific sections
- Clear boundaries between UI sections

## Using Reusable Components

### ✅ Critical Rule: Use Existing Components

**When containers have Form, Table, Modal, or Skeleton elements, ALWAYS use the existing component/element classes.**

### Form Component
Use `Form` component when container has form elements:

```ts
import { Form } from '@components/form.component';

export class SignInMainContainer {
    private readonly form: Form;
    readonly txtEmail: Input;
    readonly btnLogin: Button;
    
    constructor() {
        this.form = new Form($('.sign-in-main'));
        this.txtEmail = this.form.getInput({ label: 'Email address' });
        this.btnLogin = this.form.getButton({ label: 'Log in' });
    }
}
```

### Table Component
Use `Table` component when container displays tabular data:

```ts
import { Table } from '@components/table.component';

export class UsersMainContainer {
    readonly tblUsers: Table;
    
    constructor() {
        this.tblUsers = new Table($('.users-table'));
    }
    
    async getUserByEmail(email: string): Promise<Locator> {
        return await this.tblUsers.getRowWithData({ Email: email });
    }
}
```

### Skeleton Element
Use `Skeleton` element when container has loading placeholders:

```ts
import { Skeleton } from '@elements/common/skeleton';

export class UsersMainContainer {
    private readonly container: Locator;
    readonly skeleton: Skeleton;

    constructor() {
        this.container = $('.users-main');
        this.skeleton = new Skeleton({ parentLocator: this.container });
    }

    async waitForLoad(timeout?: number): Promise<void> {
        await this.skeleton.waitForAllHidden(timeout);
    }
}
```

Page objects should expose a high-level loading method:

```ts
export class UsersPage {
    readonly main: UsersMainContainer;

    async waitForPageLoad(timeout?: number): Promise<void> {
        await this.main.waitForLoad(timeout);
    }
}
```

### Complete Example with Components

```ts
import { $ } from '@common/element.function';
import { Form } from '@components/form.component';
import { Table } from '@components/table.component';
import { Button } from '@elements/common/button';
import { Input } from '@elements/common/input';
import { Locator } from '@playwright/test';

export class ProductsMainContainer {
    private readonly container: Locator;
    private readonly searchForm: Form;
    
    readonly txtSearch: Input;
    readonly btnSearch: Button;
    readonly tblProducts: Table;
    
    constructor() {
        this.container = $('.products-main');
        this.searchForm = new Form(this.container.locator('.search-form'));
        
        this.txtSearch = this.searchForm.getInput({ placeholder: 'Search...' });
        this.btnSearch = this.searchForm.getButton({ label: 'Search' });
        this.tblProducts = new Table(this.container.locator('table'));
    }
    
    async searchProduct(name: string): Promise<void> {
        await this.txtSearch.fill(name);
        await this.btnSearch.click();
    }
    
    async getProductByName(name: string): Promise<Locator> {
        return await this.tblProducts.getRowWithData({ Name: name });
    }
}
```

## Naming Conventions

### Containers
- `[PageName][Section]Container` - e.g., `SignInHeaderContainer`

### Elements
- `btn` - Buttons
- `txt` - Text inputs
- `lbl` - Labels
- `lnk` - Links
- `chk` - Checkboxes
- `drp` - Dropdowns
- `tbl` - Tables

### Methods
- Action methods: `signIn()`, `fillForm()`, `submitData()`
- Getter methods: `getTitle()`, `getErrorMessage()`
- Navigation methods: `goToForgotPassword()`, `navigateToRegister()`
