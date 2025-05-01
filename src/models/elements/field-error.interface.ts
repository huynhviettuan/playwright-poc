export interface IFieldError {
    getStatus(field: string): Promise<string>;
}
