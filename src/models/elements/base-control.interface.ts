import { type ElementRoleEnum, type ElementStateEnum } from '@enums/element.enum';
import { type Locator } from '@playwright/test';

export interface IBaseControl {
    get element(): Locator;
    locator(selector: string): Locator;
    setElement(locator: Locator): void;
    withText(text: string): IBaseControl;
    withIndex(index: number): IBaseControl;
    getParent(): Locator;
    getByTestId(id: string): Locator;
    getByText(value: string, options?: { exact?: boolean }): Locator;
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
    ): Locator;
    focus(): Promise<void>;
    waitFor(options: { state: ElementStateEnum; timeout?: number }): Promise<void>;
    isVisible(): Promise<boolean>;
    isChecked(): Promise<boolean>;
    isDisabled(): Promise<boolean>;
    isEditable(): Promise<boolean>;
    isEnabled(): Promise<boolean>;
    isHidden(): Promise<boolean>;
    getTextContent(): Promise<string | null>;
    getInnerText(): Promise<string>;
    count(): Promise<number>;
    getAllElements(): Promise<Locator[]>;
    filter(options?: { has?: Locator; hasText?: string | RegExp }): Locator;
    scrollIntoView(options?: { timeout?: number }): Promise<void>;
    allInnerTexts(): Promise<string[]>;
    allTextContents(): Promise<string[]>;
    getAttribute(name: string): Promise<string>;
}
