import { $ } from '@common/element.function';
import { ElementRoleEnum, ElementStateEnum } from '@enums/element.enum';
import type { Locator } from '@playwright/test';

export class Table {
    table: Locator;
    tableBody: Locator;
    tableHeader: Locator;
    tableRow: Locator;

    constructor(parent?: Locator) {
        const baseLocator = parent ? parent.locator('table') : $('table');
        this.initializeTable(baseLocator);
    }

    private initializeTable(table: Locator): void {
        this.table = table;
        this.tableBody = this.table.locator('tbody');
        this.tableHeader = this.table.locator('thead');
        this.tableRow = this.table.locator('tr');
    }

    withParentLocator(parentLocator: Locator): void {
        this.initializeTable(parentLocator.locator('table'));
    }

    async waitForTableVisible(): Promise<void> {
        await this.tableHeader.waitFor({ state: ElementStateEnum.VISIBLE });
    }

    async getHeaders(): Promise<string[]> {
        return await this.tableHeader.locator('th').allInnerTexts();
    }

    getHeaderByValue(column: string): Locator {
        return this.tableHeader.locator(`th:has-text("${column}")`);
    }

    getCellByValue(value: string): Locator {
        return this.tableBody.locator('td', { hasText: value });
    }

    getCellByIndex(rowIndex: number = 0, columnIndex: number = 0): Locator {
        return this.tableBody.locator('tr').nth(rowIndex).locator('td').nth(columnIndex);
    }

    getButtonInRow(cellValue: string, option: { name?: string; index?: number }): Locator {
        const row = this.getCellByValue(cellValue).locator('..');
        return option.index !== undefined
            ? row.getByRole(ElementRoleEnum.BUTTON).nth(option.index)
            : row.getByRole(ElementRoleEnum.BUTTON, { name: option.name });
    }

    getMenuIconInRow(cellValue: string): Locator {
        return this.getCellByValue(cellValue).locator('..').locator('.font-icon--three-dot');
    }

    async getCellsByColumn(columnName: string): Promise<Locator[]> {
        const columnIndex = await this.getColumnIndexByHeader(columnName);
        if (columnIndex === -1) {
            throw new Error(`Column "${columnName}" not found in table headers`);
        }
        const rows = await this.tableBody.locator('tr').all();
        return rows.map((row) => row.locator('td').nth(columnIndex));
    }

    async getRowWithData(data: Record<string, string | string[]>): Promise<Locator> {
        const rows = await this.tableBody.locator('tr').all();
        const headers = await this.getHeaders();

        for (const [columnName] of Object.entries(data)) {
            const index =
                columnName === ''
                    ? headers.findIndex((h) => h.trim() === '')
                    : headers.findIndex((h) => h.trim() === columnName);
            if (index === -1) {
                throw new Error(
                    `Column "${columnName}" not found. Available headers: [${headers.map((h) => `"${h.trim()}"`).join(', ')}]`
                );
            }
        }

        for (const row of rows) {
            const cells = await row.locator('td').all();
            let isMatch = true;

            for (const [columnName, expectedValue] of Object.entries(data)) {
                const values = Array.isArray(expectedValue) ? expectedValue : [expectedValue];
                const columnIndex =
                    columnName === ''
                        ? headers.findIndex((h) => h.trim() === '')
                        : headers.findIndex((h) => h.trim() === columnName);

                const cellText = await cells[columnIndex]?.innerText();
                if (!values.some((v) => cellText?.includes(v))) {
                    isMatch = false;
                    break;
                }
            }

            if (isMatch) return row;
        }

        throw new Error(
            `No row found matching ${JSON.stringify(data)}. Table has ${rows.length} row(s).`
        );
    }

    async getLengthOfRows(): Promise<number> {
        return await this.tableBody.locator('tr').count();
    }

    async sortColumn(column: string): Promise<void> {
        await this.getHeaderByValue(column).click();
        await this.waitForTableDataDisplayed();
    }

    async getColumnIndexByHeader(column: string): Promise<number> {
        const headers = await this.getHeaders();
        return headers.findIndex((h) => h.trim() === column);
    }

    async getRowIndexByValue(value: string): Promise<number> {
        return this.getCellByValue(value)
            .locator('..')
            .evaluate((tr) => Array.from(tr.parentElement.children).indexOf(tr));
    }

    async getColumnDataByHeader(column: string): Promise<string[]> {
        const columnIndex = await this.getColumnIndexByHeader(column);
        if (columnIndex === -1) {
            throw new Error(`Column "${column}" not found in table headers`);
        }
        const rows = await this.tableBody.locator('tr').all();

        const data: string[] = [];
        for (const row of rows) {
            const cell = row.locator('td').nth(columnIndex);
            const text = await cell.innerText();
            data.push(text.trim());
        }

        return data;
    }

    async waitForTableDataDisplayed(timeout: number = 30000): Promise<void> {
        await this.tableBody.first().waitFor({ state: ElementStateEnum.VISIBLE, timeout });

        const firstRow = this.tableBody.locator('tr').first();
        await firstRow.waitFor({ state: ElementStateEnum.VISIBLE, timeout });

        await firstRow.locator('td').first().waitFor({ state: ElementStateEnum.VISIBLE, timeout });
    }
}
