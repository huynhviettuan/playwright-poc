export interface PdfMetadata {
    title?: string;
    author?: string;
    pageCount: number;
    creationDate?: Date;
}

export interface PdfFormField {
    name: string;
    type: 'text' | 'checkbox' | 'dropdown' | 'radio';
    value?: string;
}
