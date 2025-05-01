export interface ISelect {
    selectOption(option: string, exact?: boolean): Promise<void>;
    selectOptions?(options: string[], exact?: boolean): Promise<void>;
    selectOptionByIndex?(index: number): Promise<void>;
    getSelectedOption?(): Promise<string>;
}
