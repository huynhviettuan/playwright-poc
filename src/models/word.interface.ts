export interface WordMetadata {
    title?: string;
    author?: string;
    description?: string;
    createdAt?: Date;
    modifiedAt?: Date;
}

export interface WordTable {
    headers: string[];
    rows: string[][];
}

export interface WordImage {
    altText?: string;
    contentType: string;
    buffer: Buffer;
}
