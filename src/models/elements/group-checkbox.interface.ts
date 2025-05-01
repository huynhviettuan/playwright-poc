export interface IGroupCheckBox {
    check(option: string): Promise<void>;
    uncheck(option: string): Promise<void>;
    isOptionChecked(option: string): Promise<boolean>;
    multipleCheck(options: string[]): Promise<void>;
}
