import {
    type APIRequestContext,
    type Browser,
    type BrowserContext,
    type BrowserContextOptions,
    chromium,
    firefox,
    type LaunchOptions,
    type Page,
    request,
    webkit
} from '@playwright/test';
import { AsyncLocalStorage } from 'async_hooks';

// Statics are safe: each Playwright worker is a separate Node process, and tests
// within a worker run sequentially. An AsyncLocalStorage refactor was attempted
// to make this provably safe under hypothetical intra-worker test concurrency —
// it doesn't work because Playwright's fixture `use()` callback runs the test
// body in a different async context than the fixture setup, so ALS state set in
// the fixture is invisible to the test. If true per-test isolation is ever
// required, inject BrowserInstance via a per-test Playwright fixture instead.

const customUserPage: AsyncLocalStorage<Page> = new AsyncLocalStorage();

// Function to use a specific page in an async context
export async function usePage<T>(page: Page, callBack: () => Promise<T>): Promise<T> {
    return customUserPage.run(page, async () => {
        return await callBack();
    });
}

export enum BrowserName {
    CHROMIUM = 'chromium',
    CHROME = 'chrome',
    CHROME_BETA = 'chrome-beta',
    FIREFOX = 'firefox',
    WEBKIT = 'webkit',
    MSEDGE = 'msedge',
    MSEDGE_BETA = 'msedge-beta',
    MSEDGE_DEV = 'msedge-dev'
}

export class Context {
    private readonly context: BrowserContext;
    private readonly _pages: Page[] = [];
    private _previousPage: Page | undefined;
    private readonly _pageStack: Page[] = [];
    private _isMobile = false;

    constructor(context: BrowserContext) {
        this.context = context;
        this._pages = this.context.pages();
        this.context.on('page', (page) => this._pages.push(page));
    }

    get browserContext(): BrowserContext {
        return this.context;
    }

    get pages(): Page[] {
        return this._pages;
    }

    get previousPage(): Page | undefined {
        return this._previousPage;
    }

    set previousPage(page: Page | undefined) {
        this._previousPage = page;
    }

    get pageStack(): Page[] {
        return this._pageStack;
    }

    pushPage(page: Page): void {
        this._pageStack.push(page);
    }

    popPage(): Page | undefined {
        return this._pageStack.pop();
    }

    get isMobile(): boolean {
        return this._isMobile;
    }

    set isMobile(isMobile: boolean) {
        this._isMobile = isMobile;
    }

    async newPage(): Promise<Page> {
        const page = await this.context.newPage();
        this._pages.push(page);
        return page;
    }
}

export class BrowserInstance {
    public static browserName: BrowserName | undefined;
    private static _browser: Browser | undefined;
    private static _currentContext: Context | undefined;
    private static _currentPage: Page | undefined;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    static get isContextMobile(): boolean {
        return this.context.isMobile;
    }

    static set isContextMobile(isMobile: boolean) {
        this.context.isMobile = isMobile;
    }

    static get currentPage(): Page {
        const customPage = customUserPage.getStore();
        if (customPage) return customPage;
        if (this._currentPage) return this._currentPage;
        throw new Error(`Page was not started`);
    }

    static set currentPage(page: Page | undefined) {
        this._currentPage = page;
    }

    static withPage(page: Page): void {
        this.currentPage = page;
        this.withContext(page.context());
    }

    private static get context(): Context {
        if (this._currentContext) return this._currentContext;
        throw new Error(`Context was not started`);
    }

    static get currentContext(): BrowserContext {
        return this.context.browserContext;
    }

    static set currentContext(context: BrowserContext | undefined) {
        if (context) this._currentContext = new Context(context);
        else this._currentContext = undefined;
    }

    static withContext(context: BrowserContext): void {
        this.currentContext = context;
        this.currentContext.on('page', (page) => {
            if (this._currentPage) this.context.previousPage = this.currentPage;
            this.currentPage = page;
        });
        if (this._browser) return;
        const currentBrowser = context.browser();
        if (currentBrowser) this.browser = currentBrowser;
        else throw new Error(`Browser is undefined and 'context.browser()' returns null.`);
    }

    static get browser(): Browser {
        if (this._browser) return this._browser;
        throw new Error(`Browser was not started`);
    }

    static set browser(browser: Browser | undefined) {
        this._browser = browser;
    }

    static withBrowser(browser: Browser): void {
        this.browser = browser;
    }

    static async getRequest(): Promise<APIRequestContext> {
        return await request.newContext();
    }

    private static async launch(browserName?: BrowserName, options?: LaunchOptions): Promise<Browser> {
        this.browserName = browserName;
        switch (browserName) {
            case BrowserName.CHROME:
                return await chromium.launch({ ...options, ...{ channel: 'chrome' } });
            case BrowserName.MSEDGE:
                return await chromium.launch({ ...options, ...{ channel: 'msedge' } });
            case BrowserName.WEBKIT:
                return await webkit.launch({ ...options });
            case BrowserName.FIREFOX:
                return await firefox.launch({ ...options });
            default:
                return chromium.launch({ ...options });
        }
    }

    public static async start(browserName?: BrowserName, options?: LaunchOptions): Promise<Browser> {
        this.browser = await this.launch(browserName, options);
        return this.browser;
    }

    public static async startNewContext(options?: BrowserContextOptions): Promise<BrowserContext> {
        this.currentContext = await this.browser.newContext(options);
        this.currentContext.on('page', (page) => {
            if (this._currentPage) this.context.previousPage = this.currentPage;
            this.currentPage = page;
        });
        return this.currentContext;
    }

    public static async startNewPage(options?: BrowserContextOptions): Promise<Page> {
        if (!this._currentContext) await this.startNewContext(options);
        if (this._currentPage) {
            this.context.previousPage = this.currentPage;
            this.context.pushPage(this.currentPage);
        }
        this.currentPage = await this.currentContext.newPage();
        return this.currentPage;
    }

    public static switchToPage(page: Page): void {
        if (this._currentPage && this._currentPage !== page) {
            this.context.pushPage(this.currentPage);
        }
        this.currentPage = page;
    }

    public static async switchToPreviousPage(): Promise<void> {
        const previousPage = this.context.popPage();
        if (!previousPage) {
            throw new Error('No previous page in stack');
        }
        this.currentPage = previousPage;
        await this.currentPage.bringToFront();
    }

    public static async close(): Promise<void> {
        await this.browser.close();
        this._currentPage = undefined;
        this._currentContext = undefined;
        this._browser = undefined;
    }

    public static async switchToPreviousTab(): Promise<void> {
        if (!this.context.previousPage) {
            throw new Error(`No previous page to switch to`);
        }
        this.currentPage = this.context.previousPage;
        await this.currentPage.bringToFront();
    }

    public static async switchToTabByIndex(index: number): Promise<void> {
        if (this.context.pages.length <= index) {
            throw new Error(`Tab index out of range`);
        }
        this.currentPage = this.context.pages[index];
        await this.currentPage.bringToFront();
    }
}
