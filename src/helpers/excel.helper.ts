import { Workbook } from 'exceljs';
import path from 'path';

export class Excel {
    workbook: Workbook;
    directoryPath?: string;
    fileName: string;
    filePath: string;
    sheetName?: string;
    constructor() {
        this.workbook = new Workbook();
    }

    withFile(fileName: string): void {
        this.fileName = fileName;
        this.filePath = path.join('src', 'downloads', this.fileName);
    }

    withSheetName(sheetName: string): void {
        this.sheetName = sheetName;
    }

    async getSheetNames(): Promise<string[]> {
        try {
            await this.workbook.xlsx.readFile(this.filePath);
            return this.workbook.worksheets.map(({ name }) => name);
        } catch (err) {
            throw Error(err.toString());
        }
    }

    async readExcelCells(cells: string[]) {
        try {
            const workbook = new Workbook();
            await workbook.xlsx.readFile(this.filePath);
            const worksheet = workbook.getWorksheet(this.sheetName);
            return cells.reduce((acc, cell) => {
                if (worksheet.getCell(cell)) {
                    return { ...acc, [cell]: worksheet.getCell(cell).value };
                }
                return acc;
            }, {});
        } catch (err) {
            throw Error(err.toString());
        }
    }

    async writeExcelCells(rowIndex: number, values: Array<[string | number, string | number]>) {
        try {
            const workbook = new Workbook();
            await workbook.xlsx.readFile(this.filePath);
            const worksheet = workbook.getWorksheet(this.sheetName);
            const row = worksheet.getRow(rowIndex);
            values.forEach(([address, value]) => {
                row.getCell(address).value = value;
            });
            row.commit();
            await workbook.xlsx.writeFile(this.filePath);
        } catch (err) {
            throw Error(err.toString());
        }
    }
}
