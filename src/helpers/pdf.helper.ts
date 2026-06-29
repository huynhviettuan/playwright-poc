import { type PdfFormField, type PdfMetadata } from '@models/pdf.interface';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFRadioGroup, PDFTextField } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

export class PdfHelper {
    private readonly filePath: string | null;
    private buffer: Buffer;
    private cachedDocument: PDFDocument | null = null;

    private constructor(buffer: Buffer, filePath?: string) {
        this.buffer = buffer;
        this.filePath = filePath ?? null;
    }

    static open(fileName: string): PdfHelper {
        const filePath = path.join('src', 'downloads', fileName);
        const buffer = readFileSync(filePath);
        return new PdfHelper(buffer, filePath);
    }

    static fromBuffer(buffer: Buffer): PdfHelper {
        return new PdfHelper(buffer);
    }

    static fromPath(absolutePath: string): PdfHelper {
        const buffer = readFileSync(absolutePath);
        return new PdfHelper(buffer, absolutePath);
    }

    async getText(): Promise<string> {
        const parser = new PDFParse({ data: new Uint8Array(this.buffer) });
        const result = await parser.getText();
        await parser.destroy();
        return result.text;
    }

    async getTextFromPage(pageNumber: number): Promise<string> {
        const parser = new PDFParse({ data: new Uint8Array(this.buffer) });
        const result = await parser.getText({ first: pageNumber, last: pageNumber });
        await parser.destroy();
        return result.text;
    }

    async getPageCount(): Promise<number> {
        const parser = new PDFParse({ data: new Uint8Array(this.buffer) });
        const result = await parser.getText();
        await parser.destroy();
        return result.total;
    }

    async getTables(): Promise<string[][][]> {
        const parser = new PDFParse({ data: new Uint8Array(this.buffer) });
        const result = await parser.getTable();
        await parser.destroy();
        return result.mergedTables;
    }

    async getTablesFromPage(pageNumber: number): Promise<string[][][]> {
        const parser = new PDFParse({ data: new Uint8Array(this.buffer) });
        const result = await parser.getTable({ first: pageNumber, last: pageNumber });
        await parser.destroy();
        const page = result.pages.find((p) => p.num === pageNumber);
        return page?.tables ?? [];
    }

    async getTableAsJson(tableIndex: number = 0, pageNumber?: number): Promise<Record<string, string>[]> {
        const tables = pageNumber ? await this.getTablesFromPage(pageNumber) : await this.getTables();
        const table = tables[tableIndex];
        if (!table || table.length < 2) return [];

        const headers = table[0];
        return table.slice(1).map((row) =>
            headers.reduce(
                (obj, header, i) => {
                    obj[header] = row[i] ?? '';
                    return obj;
                },
                {} as Record<string, string>
            )
        );
    }

    async getMetadata(): Promise<PdfMetadata> {
        const doc = await this.loadDocument();
        return {
            title: doc.getTitle(),
            author: doc.getAuthor(),
            pageCount: doc.getPageCount(),
            creationDate: doc.getCreationDate()
        };
    }

    async getPageAsImage(pageNumber: number = 1): Promise<Buffer> {
        const { pdf } = await import('pdf-to-img');
        const pages = await pdf(this.buffer, { scale: 2 });
        let currentPage = 0;

        for await (const image of pages) {
            currentPage++;
            if (currentPage === pageNumber) {
                return Buffer.from(image);
            }
        }

        throw new Error(`Page ${pageNumber} not found in PDF`);
    }

    async getFormFields(): Promise<PdfFormField[]> {
        const doc = await this.loadDocument();
        const form = doc.getForm();
        const fields = form.getFields();

        return fields.map((field) => {
            const name = field.getName();

            if (field instanceof PDFTextField) {
                return { name, type: 'text' as const, value: field.getText() };
            }
            if (field instanceof PDFCheckBox) {
                return { name, type: 'checkbox' as const, value: String(field.isChecked()) };
            }
            if (field instanceof PDFDropdown) {
                return { name, type: 'dropdown' as const, value: field.getSelected().join(', ') };
            }
            if (field instanceof PDFRadioGroup) {
                return { name, type: 'radio' as const, value: field.getSelected() };
            }

            return { name, type: 'text' as const, value: undefined };
        });
    }

    async fillForm(fields: Record<string, string>): Promise<Buffer> {
        const doc = await PDFDocument.load(this.buffer);
        const form = doc.getForm();

        for (const [fieldName, value] of Object.entries(fields)) {
            const field = form.getField(fieldName);

            if (field instanceof PDFTextField) {
                field.setText(value);
            } else if (field instanceof PDFCheckBox) {
                value === 'true' ? field.check() : field.uncheck();
            } else if (field instanceof PDFDropdown) {
                field.select(value);
            } else if (field instanceof PDFRadioGroup) {
                field.select(value);
            }
        }

        const filledBytes = await doc.save();
        this.buffer = Buffer.from(filledBytes);
        this.cachedDocument = null;
        return this.buffer;
    }

    save(outputPath?: string): string {
        const savePath = outputPath ?? this.filePath ?? path.join('src', 'downloads', 'output.pdf');
        writeFileSync(savePath, this.buffer);
        return savePath;
    }

    private async loadDocument(): Promise<PDFDocument> {
        if (this.cachedDocument) {
            return this.cachedDocument;
        }
        this.cachedDocument = await PDFDocument.load(this.buffer);
        return this.cachedDocument;
    }
}
