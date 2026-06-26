# Architecture blueprint (detail)

Five layers, generic pseudocode for each, plus labeled real-code examples drawn from two production frameworks: a
Playwright/TypeScript framework (process-parallel) and a Java/Selenium/TestNG framework (thread-parallel). Each
example is illustration only — the pattern is what transfers, not the class/language names. Where the two examples
genuinely differ (only Layer 5, driven by the difference in concurrency model), both are shown side by side.

## 1. Element/Control layer

**Shape:** a small hierarchy (or role-based interfaces) wrapping the driver's native locator/selector object.

```
class BaseControl:
    constructor(locator):
        self._locator = locator
    def isVisible() / getText() / getAttribute(name) -> delegate to self._locator

class Clickable extends BaseControl:
    def click() / hover() / download() -> delegate to self._locator

class Editable extends BaseControl:
    def fill(value) / clear() / upload(file) -> delegate to self._locator

class Button extends Clickable:
    constructor(options: {parentLocator, id, label, index}):
        locator = resolve one strategy from options, scoped under parentLocator
        super(locator)
```

- Split behavior into role-based branches (`Clickable`, `Editable`, …) instead of one fat base class — an element
  only inherits the capability set matching its real semantics (Interface Segregation applied to a class tree).
- Resolve "how do I find myself" (id vs. label vs. index vs. raw locator) inside the constructor via a small
  strategy-by-config object, not via subclassing per lookup strategy.
- When an element is structurally a small object graph rather than one atomic control (a dropdown = a trigger +
  option rows; a data table = header + body + rows + cells), **compose** smaller elements instead of forcing it into
  the inheritance chain.

**Playwright/TS example** (`src/elements/base/base-control.ts`, `src/elements/common/button.ts`):
```ts
export class BaseControl implements IBaseControl {
    protected _locator: Locator;
    get element(): Locator { return this._locator; }
}
export class Button extends Clickable implements IClickable {
    constructor(option?: { parentLocator?: Locator; label?: string; index?: number; locator?: Locator; id?: string }) {
        const baseLocator = option.parentLocator || BrowserInstance.currentPage;
        const locator = option?.locator ? option.locator
            : option?.id ? baseLocator.locator(`#${option.id}`)
            : option?.label ? baseLocator.locator('button', { has: $getByText(option.label, { exact: true }) })
            : baseLocator.locator('button').nth(option.index ?? 0);
        super(locator);
    }
}
```
`parentLocator` defaulting to the current page/session is a Null-Object-style default collaborator: the same class
works whether it's page-scoped or parent-scoped, with zero branching at call sites.

**Alternate implementation technique — a single-method context interface.** Instead of a class hierarchy, some
frameworks unify the element tier and the container/component tier (Layer 2) behind one minimal interface, e.g.
`interface ElementContext { rawElement(): NativeElement }`. Because both an element and a container implement the
*same* one-method interface, either can serve as the other's parent uniformly — a container is just something that
can also answer "what's my underlying element", so nesting works arbitrarily deep without a shared abstract base
class between the two tiers. This achieves the same parent-scoping guarantee as the class hierarchy above with less
structure; pick whichever fits your language better (a hierarchy suits languages/teams that favor base classes, a
minimal interface suits languages/teams that favor composition-by-contract).

## 2. Container/Screen layer

**Shape:** one small class per logical screen region, each holding a private root locator and exposing typed
elements scoped under it; the page/screen object composes containers and exposes only business-level actions.

```
class HeaderContainer:
    constructor():
        self._root = findRegion("header")
        self.title = new Label(parentLocator=self._root, role="heading")

class MainContainer:
    constructor():
        self._root = findRegion("main")
        self.form = new Form(self._root)          # composite, see below
        self.emailInput = self.form.getInput(label="Email")
        self.loginButton = self.form.getButton(label="Log in")

class SignInPage:
    constructor():
        self.header = new HeaderContainer()
        self.main = new MainContainer()
    def signIn(email, password):
        self.main.fill(email, password)
        self.main.loginButton.click()
```

- The container's root locator is **private** — nothing outside it can bypass the scope.
- The page/screen object is a Facade: its public methods are user intents ("sign in"), not raw element access.
- For **repeated or dynamically-selected** regions (a card in a list, a named tab, a modal that can open more than
  once), expose a **factory method** returning a freshly-scoped instance per call — never a singleton/cached
  instance for these, or two logically-different regions will share state and produce flaky, cross-contaminated
  assertions.

**Playwright/TS example** (`src/components/containers/sign-in/main.container.ts`):
```ts
export class SignInMainContainer {
    private readonly container: Locator;
    private readonly form: Form;
    constructor() {
        this.container = $('main');
        this.form = new Form(this.container);
        this.txtEmail = this.form.getInput({ label: 'Email' });
        this.txtPassword = this.form.getInput({ label: 'Password' });
    }
}
```
The container doesn't build raw locators itself — it delegates field resolution to a reusable `Form` composite,
which internally caches resolved elements by a canonical key (Factory Method + memoization) so repeated calls for
"the same" field return one instance instead of re-querying.

## 3. Service/API layer

**Shape:** a base class fixing the request lifecycle (build URL, merge headers/auth, dispatch, parse, log); concrete
services declare endpoints only. Nested resources compose a child service rather than duplicating the parent's auth.

```
class BaseService:
    constructor(basePath, parent=None):
        self.basePath = parent.basePath + basePath if parent else basePath
        self._parent = parent
    def token(): return self._parent.token if self._parent else self._token
    def send(method, path, body=None): # fixed skeleton: build url -> headers -> dispatch -> parse -> log

class TokensService extends BaseService:
    constructor(): super('/tokens')
    def getAll(): return self.send('get', '/')

class AuthService extends BaseService:
    constructor(parent): super('/auth', parent)
    def signIn(body): return self.send('post', '/signin', body)

class UserOrganizationService extends BaseService:
    constructor():
        super('/user-organization')
        self.auth = new AuthService(self)   # composed sub-resource, shares parent's token via the chain
```

- This is Template Method (fixed skeleton in the base, variability in subclasses) plus a Chain-of-Responsibility-
  style lookup for token/headers that walks up through `_parent` — a child resource transparently inherits auth
  without re-declaring it.
- Model REST/RPC sub-resources as **composed** child service objects, not as flattened methods on one giant class
  and not via inheritance (a sub-resource is not "a kind of" its parent).
- Threshold: 1-2 sub-endpoints → inline method on the parent service. 3+ → extract a child service class.
- Keep request/response type definitions in a dedicated types module, never co-located inside the service file —
  consumers should be able to import types without pulling in the service implementation.

## 4. Composition root (DI/fixtures)

**Shape:** independent, single-purpose "capability" modules, each adding exactly one thing to the test context,
merged into one composition object that tests draw from.

```
# page-fixtures: adds page objects
extend(baseTest, { signInPage: (use) => use(new SignInPage()) })

# service-fixtures: adds API services
extend(baseTest, { userService: (use) => use(new UserOrganizationService()) })

# composition root
test = mergeAll(pageFixtures, serviceFixtures, dataFixtures, notificationFixtures, ...)
expect = mergeAssertions(customMatchers)
```

- Every test file imports `test`/`expect` from this **one** composition module — never from the underlying test
  framework directly. This is the single seam where cross-cutting capabilities (custom assertions, reporting hooks,
  auto-cleanup fixtures) are assembled; swapping an implementation means editing one fixture file, not every test.
- Each fixture module has single responsibility (one capability); the merge step is a Facade collecting them.
- Data-factory fixtures should default to **auto-cleanup** (track what was created, tear it down after the test)
  rather than requiring every test to remember manual cleanup.

## 5. Driver/session instance holder

**Shape:** one static holder for "the current session/page/client", with a narrow, explicit escape hatch for the
rare case where one call chain needs a different session than the ambient one.

```
class SessionInstance:
    static _current = None
    static get current():
        override = scopedOverrideStorage.get()   # narrow, explicit opt-in scoping mechanism
        return override or self._current or raise("No session started")
    static startNew(): ...
    static switchTo(session): self._current = session
```

**Verify your runner's concurrency model before choosing this shape.** A static singleton (above) is only safe when
your test runner's parallelism is process-based (one worker = one OS process, sequential execution within a
worker). If instead your runner is thread-pool-based and can execute multiple test methods concurrently *within one
process, reusing one instance of the test class* (common for JVM runners like TestNG/JUnit with a
`parallel="methods"`-style setting), a bare static singleton **will** leak state between concurrently-running
tests — use a thread-local registry instead:

```
class DriverFactory:
    private static threadLocalDriver = new ThreadLocal<Driver>()
    static getDriver():
        driver = threadLocalDriver.get()
        if driver is None: raise("Driver not started for this thread")
        return driver
    static startDriver(config):
        driver = buildDriver(config)   # local or remote/grid, selected by a Strategy-by-config switch
        threadLocalDriver.set(driver)
    static quitDriver():
        threadLocalDriver.get()?.quit()
        threadLocalDriver.remove()
```

The corollary rule that makes this safe: **the test class itself must hold no instance fields for the driver, or
for any other per-test state** (e.g. a log-correlation id) — because the runner may reuse one instance of that class
across concurrently-running test methods, an instance field is effectively unsynchronized shared mutable state
between threads. Every accessor re-resolves from thread-local storage on every call instead of caching in `self`.

**Selenium/Java/TestNG example** (`DriverFactory` + `BaseTest`): `BaseTest` deliberately declares zero instance
fields for driver or config; `driver()` and `config()` are stateless methods that call into the thread-local
registry above on every invocation. The same project also clears an SLF4J MDC log-correlation id in an always-run
teardown step, for the identical reason — a value set via thread-local-backed logging context must not survive past
the test that set it, or it leaks into whichever next test happens to reuse that thread.

**Playwright/TS example** (`src/common/browser.ts`) — the process-based counterpart — additionally layers a stack
(`pushPage`/`popPage`) for multi-tab navigation (a Memento-style history) and an `AsyncLocalStorage`-based override
for the rare call chain that needs a different page than the process-wide default — a narrow, explicit exception to
the singleton rather than a general isolation mechanism. Don't add either project's extra machinery speculatively
(KISS) — the point of comparing them is to pick the one holder shape that actually matches your runner's real
concurrency model, not to combine both.
