import { Workbook, Worksheet } from 'exceljs';
import path from 'path';

export class ExcelHelper {
    private filePath: string;
    private sheetName: string;

    private constructor(filePath: string, sheetName?: string) {
        this.filePath = filePath;
        this.sheetName = sheetName;
    }

    static open(fileName: string, sheetName?: string): ExcelHelper {
        const filePath = path.join('src', 'downloads', fileName);
        return new ExcelHelper(filePath, sheetName);
    }

    withSheet(sheetName: string): ExcelHelper {
        this.sheetName = sheetName;
        return this;
    }

    async getSheetNames(): Promise<string[]> {
        const workbook = await this.loadWorkbook();
        return workbook.worksheets.map((sheet) => sheet.name);
    }

    async readCells(cells: string[]): Promise<Record<string, unknown>> {
        const worksheet = await this.getWorksheet();
        return cells.reduce((result, cell) => {
            const value = worksheet.getCell(cell).value;
            return { ...result, [cell]: value };
        }, {});
    }

    async readCell(cell: string): Promise<unknown> {
        const worksheet = await this.getWorksheet();
        return worksheet.getCell(cell).value;
    }

    async writeCells(rowIndex: number, values: Array<[string | number, string | number]>): Promise<void> {
        const workbook = await this.loadWorkbook();
        const worksheet = this.getWorksheetFromWorkbook(workbook);
        const row = worksheet.getRow(rowIndex);

        values.forEach(([address, value]) => {
            row.getCell(address).value = value;
        });

        row.commit();
        await workbook.xlsx.writeFile(this.filePath);
    }

    async writeCell(rowIndex: number, address: string | number, value: unknown): Promise<void> {
        await this.writeCells(rowIndex, [[address, value as string | number]]);
    }

    async getRowAsJson(rowIndex: number, headerRow: number = 1): Promise<Record<string, unknown>> {
        const worksheet = await this.getWorksheet();
        const headers = worksheet.getRow(headerRow);
        const dataRow = worksheet.getRow(rowIndex);
        const result: Record<string, unknown> = {};

        headers.eachCell((cell, colNumber) => {
            const header = cell.value?.toString();
            const value = dataRow.getCell(colNumber).value;
            if (header) {
                result[header] = value;
            }
        });

        return result;
    }

    async getRowsAsJson(startRow: number, endRow: number, headerRow: number = 1): Promise<Record<string, unknown>[]> {
        const results: Record<string, unknown>[] = [];

        for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
            const rowData = await this.getRowAsJson(rowIndex, headerRow);
            results.push(rowData);
        }

        return results;
    }

    async getColumnAsJson(
        columnKey: string | number,
        headerColumn: string | number = 1
    ): Promise<Record<string, unknown>> {
        const worksheet = await this.getWorksheet();
        const result: Record<string, unknown> = {};

        worksheet.getColumn(columnKey).eachCell((cell, rowNumber) => {
            const header = worksheet.getCell(rowNumber, headerColumn).value?.toString();
            if (header) {
                result[header] = cell.value;
            }
        });

        return result;
    }

    async getColumnsAsJson(
        columns: (string | number)[],
        headerColumn: string | number = 1
    ): Promise<Record<string, unknown>[]> {
        const results: Record<string, unknown>[] = [];

        for (const columnKey of columns) {
            const columnData = await this.getColumnAsJson(columnKey, headerColumn);
            results.push(columnData);
        }

        return results;
    }

    private async loadWorkbook(): Promise<Workbook> {
        const workbook = new Workbook();
        await workbook.xlsx.readFile(this.filePath);
        return workbook;
    }

    private async getWorksheet(): Promise<Worksheet> {
        const workbook = await this.loadWorkbook();
        return this.getWorksheetFromWorkbook(workbook);
    }

    private getWorksheetFromWorkbook(workbook: Workbook): Worksheet {
        if (!this.sheetName) {
            throw new Error('Sheet name not specified. Use withSheet() to set it.');
        }
        return workbook.getWorksheet(this.sheetName);
    }
}
