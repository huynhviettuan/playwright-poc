import { $getByText } from '@common/element.function';
import { ElementRoleEnum, ElementStateEnum } from '@enums/element.enum';
import { IBaseControl } from '@models/elements/base-control.interface';
import { Locator } from '@playwright/test';

export class BaseControl implements IBaseControl {
    private baseLocator: Locator;
    private originalLocator: Locator;

    constructor(locator?: Locator) {
        this.baseLocator = locator;
        this.originalLocator = locator;
    }

    get element(): Locator {
        return this.baseLocator;
    }

    setElement(locator: Locator): void {
        this.baseLocator = locator;
    }

    withText(text: string): void {
        this.setElement(
            this.originalLocator.filter({
                has: $getByText(text, { exact: true })
            })
        );
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

    withIndex(index: number): void {
        this.setElement(this.originalLocator.nth(index));
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
