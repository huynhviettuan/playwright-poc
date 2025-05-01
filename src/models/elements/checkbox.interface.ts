export interface ICheckBox {
    check(): Promise<void>;
    uncheck(): Promise<void>;
}
