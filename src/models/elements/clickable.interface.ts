export interface IClickable {
    click(): Promise<void>;
    doubleClick(): Promise<void>;
    hover(): Promise<void>;
}
