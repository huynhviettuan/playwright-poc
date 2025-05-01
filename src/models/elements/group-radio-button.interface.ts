export interface IGroupRadioButton {
    selectOption(option: string): Promise<void>;
    setState(isYes: boolean): Promise<void>;
    isOptionChecked(option: string): Promise<boolean>;
}
