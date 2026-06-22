import { $getByText } from '@common/element.function';
import { type ElementRoleEnum, type ElementStateEnum } from '@enums/element.enum';
import { type IBaseControl } from '@models/elements/base-control.interface';
import { type Locator } from '@playwright/test';

export class BaseControl implements IBaseControl {
    protected _locator: Locator;

    constructor(locator?: Locator) {
        this._locator = locator;
    }

    get element(): Locator {
        return this._locator;
    }

    setElement(locator: Locator): void {
        this._locator = locator;
    }

    withText(text: string): this {
        const filtered = this._locator.filter({
            has: $getByText(text, { exact: true })
        });
        const clone = this.clone();
        clone._locator = filtered;
        return clone;
    }

    withIndex(index: number): this {
        const clone = this.clone();
        clone._locator = this._locator.nth(index);
        return clone;
    }

    private clone(): this {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const instance: this = Object.create(Object.getPrototypeOf(this) as object);
        return Object.assign(instance, this);
    }

    locator(selector: string): Locator {
        return this.element.locator(selector);
    }

    getParent(): Locator {
        return this.element.locator('..');
    }

    getByTestId(id: string): Locator {
        return this.element.getByTestId(id);
    }

    getByText(
        value: string,
        options?: {
            exact?: boolean;
        }
    ): Locator {
        return this.element.getByText(value, options);
    }

    getByRole(
        role: ElementRoleEnum,
        options?: {
            checked?: boolean;
            disabled?: boolean;
            exact?: boolean;
            expanded?: boolean;
            includeHidden?: boolean;
            level?: number;
            name?: string | RegExp;
            pressed?: boolean;
            selected?: boolean;
        }
    ): Locator {
        return this.element.getByRole(role, options);
    }

    filter(options?: { has?: Locator; hasText?: string | RegExp }): Locator {
        return this.element.filter(options);
    }

    async focus(): Promise<void> {
        await this.element.focus();
    }

    async waitFor(options: { state: ElementStateEnum; timeout?: number }): Promise<void> {
        await this.element.waitFor(options);
    }

    async isVisible(): Promise<boolean> {
        return await this.element.isVisible();
    }

    async isChecked(): Promise<boolean> {
        return await this.element.isChecked();
    }

    async isDisabled(): Promise<boolean> {
        return await this.element.isDisabled();
    }

    async isEditable(): Promise<boolean> {
        return await this.element.isEditable();
    }

    async isEnabled(): Promise<boolean> {
        return await this.element.isEnabled();
    }

    async isHidden(): Promise<boolean> {
        return await this.element.isHidden();
    }

    async getTextContent(): Promise<string | null> {
        return (await this.element.textContent()).trim();
    }

    async getInnerText(): Promise<string> {
        return await this.element.innerText();
    }

    async count(): Promise<number> {
        return await this.element.count();
    }

    async getAllElements(): Promise<Locator[]> {
        return await this.element.all();
    }

    async scrollIntoView(options?: { timeout?: number }): Promise<void> {
        await this.element.scrollIntoViewIfNeeded(options);
    }

    public async allInnerTexts(): Promise<string[]> {
        return await this.element.allInnerTexts();
    }

    public async allTextContents(): Promise<string[]> {
        return await this.element.allTextContents();
    }

    public async getAttribute(name: string): Promise<string> {
        return await this.element.getAttribute(name);
    }
}
