# Skeleton Loading Element

Modern frontends often show skeleton placeholders while page data loads. This framework provides a reusable `Skeleton` element to wait until skeletons are hidden before interacting with page elements.

## Location

```ts
import { Skeleton } from '@elements/common/skeleton';
```

## Usage in Containers

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

## Usage in Page Objects

```ts
export class UsersPage {
    readonly main: UsersMainContainer;

    async waitForPageLoad(timeout?: number): Promise<void> {
        await this.main.waitForLoad(timeout);
    }
}
```

## Usage in Tests

```ts
await BrowserInstance.currentPage.goto(Endpoints.api.users);
await usersPage.waitForPageLoad();

await expect(usersPage.main.tblUsers).toBeVisible();
```

## Custom Selector

```ts
this.skeleton = new Skeleton({
    parentLocator: this.container,
    selector: '[data-testid="user-list-skeleton"]'
});
```

## Default Selectors

- `.skeleton`
- `.ant-skeleton`
- `.MuiSkeleton-root`
- `[data-testid*="skeleton"]`
- `[class*="skeleton"]`

## API

```ts
await skeleton.waitForHidden(timeout);
await skeleton.waitForAllHidden(timeout);
await skeleton.hasVisibleSkeleton();
await skeleton.count();
```

## Best Practices

- Add `Skeleton` to containers, not directly to tests
- Page objects should expose `waitForPageLoad()`
- Tests should call `waitForPageLoad()` after navigation or major data refresh
- Use custom selectors when default skeleton selectors are too broad
