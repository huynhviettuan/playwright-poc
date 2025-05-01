export interface IUploadFile {
    withIndex(index: number): void;
    uploadFile(fileName: string): Promise<void>;
}
