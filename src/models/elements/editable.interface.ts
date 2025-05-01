export interface IEditable {
    fill(text: string): Promise<void>;
    clear(): Promise<void>;
    fillAndPressEnter(text: string): Promise<void>;
    uploadFile(fileName: string): Promise<void>;
}
