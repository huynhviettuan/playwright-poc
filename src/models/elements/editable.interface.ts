export interface IEditable {
    fill(text: string): Promise<void>;
    clear(): Promise<void>;
    search(text: string): Promise<void>;
    uploadFile(fileName: string, options?: { folderPath?: string; useBuffer?: boolean }): Promise<void>;
    dropFile(fileName: string, options?: { folderPath?: string }): Promise<void>;
    dropData(data: Record<string, string>): Promise<void>;
}
