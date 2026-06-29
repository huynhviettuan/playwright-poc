import { type WordImage, type WordMetadata, type WordTable } from '@models/word.interface';
import { readFileSync, writeFileSync } from 'fs';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import path from 'path';

export class WordHelper {
    private readonly filePath: string | null;
    private buffer: Buffer;
    private cachedHtml: string | null = null;

    private constructor(buffer: Buffer, filePath?: string) {
        this.buffer = buffer;
        this.filePath = filePath ?? null;
    }

    static open(fileName: string): WordHelper {
        const filePath = path.join('src', 'downloads', fileName);
        const buffer = readFileSync(filePath);
        return new WordHelper(buffer, filePath);
    }

    static fromBuffer(buffer: Buffer): WordHelper {
        return new WordHelper(buffer);
    }

    static fromPath(absolutePath: string): WordHelper {
        const buffer = readFileSync(absolutePath);
        return new WordHelper(buffer, absolutePath);
    }

    async getText(): Promise<string> {
        const result = await mammoth.extractRawText({ buffer: this.buffer });
        return result.value;
    }

    async getHtml(): Promise<string> {
        if (this.cachedHtml) return this.cachedHtml;
        const result = await mammoth.convertToHtml({ buffer: this.buffer });
        this.cachedHtml = result.value;
        return this.cachedHtml;
    }

    async getHeadings(): Promise<{ level: number; text: string }[]> {
        const html = await this.getHtml();
        const headings: { level: number; text: string }[] = [];
        const regex = /<h(\d)[^>]*>(.*?)<\/h\d>/gi;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(html)) !== null) {
            headings.push({
                level: parseInt(match[1]),
                text: match[2].replace(/<[^>]*>/g, '')
            });
        }

        return headings;
    }

    async getTables(): Promise<WordTable[]> {
        const html = await this.getHtml();
        const tables: WordTable[] = [];
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        let tableMatch: RegExpExecArray | null;

        while ((tableMatch = tableRegex.exec(html)) !== null) {
            const tableHtml = tableMatch[1];
            const rows: string[][] = [];
            const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            let rowMatch: RegExpExecArray | null;

            while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
                const cells: string[] = [];
                const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
                let cellMatch: RegExpExecArray | null;

                while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                    cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
                }

                if (cells.length > 0) rows.push(cells);
            }

            if (rows.length > 0) {
                tables.push({
                    headers: rows[0],
                    rows: rows.slice(1)
                });
            }
        }

        return tables;
    }

    async getTableAsJson(tableIndex: number = 0): Promise<Record<string, string>[]> {
        const tables = await this.getTables();
        const table = tables[tableIndex];
        if (!table) return [];

        return table.rows.map((row) =>
            table.headers.reduce(
                (obj, header, i) => {
                    obj[header] = row[i] ?? '';
                    return obj;
                },
                {} as Record<string, string>
            )
        );
    }

    async getImages(): Promise<WordImage[]> {
        const images: WordImage[] = [];
        await mammoth.convertToHtml(
            { buffer: this.buffer },
            {
                convertImage: mammoth.images.imgElement((image) => {
                    return image.read('base64').then((base64) => {
                        images.push({
                            contentType: image.contentType,
                            buffer: Buffer.from(base64, 'base64'),
                            altText: undefined
                        });
                        return { src: '' };
                    });
                })
            }
        );
        return images;
    }

    async getMetadata(): Promise<WordMetadata> {
        const zip = await JSZip.loadAsync(this.buffer);
        const coreXml = await zip.file('docProps/core.xml')?.async('string');

        if (!coreXml) return {};

        const getTag = (xml: string, tag: string): string | undefined => {
            const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
            return match?.[1] || undefined;
        };

        const parseDate = (value?: string): Date | undefined => {
            return value ? new Date(value) : undefined;
        };

        return {
            title: getTag(coreXml, 'dc:title'),
            author: getTag(coreXml, 'dc:creator'),
            description: getTag(coreXml, 'dc:description'),
            createdAt: parseDate(getTag(coreXml, 'dcterms:created')),
            modifiedAt: parseDate(getTag(coreXml, 'dcterms:modified'))
        };
    }

    async replacePlaceholders(replacements: Record<string, string>): Promise<Buffer> {
        const zip = await JSZip.loadAsync(this.buffer);
        const docXml = await zip.file('word/document.xml')?.async('string');

        if (!docXml) throw new Error('Invalid .docx: missing word/document.xml');

        let updatedXml = docXml;
        for (const [placeholder, value] of Object.entries(replacements)) {
            updatedXml = updatedXml.replace(new RegExp(this.escapeRegex(placeholder), 'g'), value);
        }

        zip.file('word/document.xml', updatedXml);
        const outputBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        this.buffer = outputBuffer;
        this.cachedHtml = null;
        return outputBuffer;
    }

    save(outputPath?: string): string {
        const savePath = outputPath ?? this.filePath ?? path.join('src', 'downloads', 'output.docx');
        writeFileSync(savePath, this.buffer);
        return savePath;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
