import { $, $getByText } from '@common/element.function';
import { ElementRoleEnum, ElementStateEnum } from '@enums/element.enum';
import { Locator } from 'playwright-core';

export class Table {
    table: Locator;
    tableBody: Locator;
    tableHeader: Locator;
    tableRow: Locator;
    tableParentHeaderXpath?: string;

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

    setTableParentHeaderXpath(tableParentHeaderXpath: string): void {
        this.tableParentHeaderXpath = tableParentHeaderXpath;
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

    getCellByIndex(rowIndex = 0, columnIndex = 0): Locator {
        return this.tableBody.locator('tr').nth(rowIndex).locator('td').nth(columnIndex);
    }

    getButtonInRow(
        cellValue: string,
        option: {
            name?: string;
            index?: number;
        }
    ): Locator {
        const { index, name } = option;
        const baseLocator: Locator = this.getCellByValue(cellValue).locator('..');
        return index
            ? baseLocator.getByRole(ElementRoleEnum.BUTTON).nth(index)
            : baseLocator.getByRole(ElementRoleEnum.BUTTON, { name });
    }

    getColumnTitle(columnTitle: string): Locator {
        return this.tableHeader.locator('th', { hasText: columnTitle });
    }

    getCellsByColumn(column: string): Locator {
        return this.tableBody.locator(
            `//td[count(//table//th[normalize-space()="${column}"]/preceding-sibling::th)+1]`
        );
    }

    getMenuIconInRow(cellValue: string): Locator {
        return this.getCellByValue(cellValue).locator('..').locator('.font-icon--three-dot');
    }

    getRowWithData(data: Record<string, string | string[]>): Locator {
        let expectedRow: Locator = this.tableBody;
        for (const [key, value] of Object.entries(data)) {
            const values: string[] = Array.isArray(value) ? value : [value];
            for (const item of values) {
                if (key === '') {
                    const emptyColumnIndexXpath = `count(${this.tableParentHeaderXpath ?? ''}//table//th[normalize-space()]/preceding-sibling::th)+2`;
                    expectedRow = expectedRow
                        .locator(`//td[${emptyColumnIndexXpath}]`)
                        .filter({
                            has: $getByText(item, { exact: true })
                        })
                        .locator('..');
                } else {
                    const columnIndexXpath = `count(${this.tableParentHeaderXpath ?? ''}//table//th[normalize-space()="${key}"]/preceding-sibling::th)+1`;
                    expectedRow = expectedRow
                        .locator(`//td[${columnIndexXpath}]`)
                        .filter({
                            has: $getByText(item, { exact: true })
                        })
                        .locator('..');
                }
            }
        }
        return expectedRow;
    }

    async getLengthOfRows(): Promise<number> {
        return (await this.tableBody.locator('tr').all()).length;
    }

    async sortColumn(column: string): Promise<void> {
        await this.tableHeader.locator('th', { hasText: column }).locator('..').click();
        await this.waitForTableDataDisplayed();
    }

    async getColumnIndexByHeader(column: string): Promise<number> {
        return this.getHeaderByValue(column).evaluate((th) => {
            const thElements = Array.from(th.parentElement.children);
            return thElements.indexOf(th);
        });
    }

    async getRowIndexByValue(value: string): Promise<number> {
        return this.getCellByValue(value)
            .locator('..')
            .evaluate((tr) => {
                const trElements = Array.from(tr.parentElement.children);
                return trElements.indexOf(tr);
            });
    }

    async getColumnDataByHeader(column: string): Promise<string[]> {
        const columnIndex = await this.getColumnIndexByHeader(column);

        const columnData = await this.tableBody.locator('tr').evaluateAll((rows, columnIndex) => {
            return rows.map((row) => row.children[columnIndex]?.textContent.trim() || '');
        }, columnIndex);

        return columnData;
    }

    async waitForTableDataDisplayed(): Promise<void> {
        await this.tableBody.first().waitFor({ state: ElementStateEnum.VISIBLE });
        const isValueOfCellDisplayed: (retry?: number) => Promise<void> = async (retry = 0): Promise<void> => {
            const retryNumber = 100;
            const tds: Locator[] = await this.tableBody.first().locator('td').all();
            for (let i = 0; i < tds.length; i++) {
                const textContent = await tds[i].innerText();
                if (textContent.trim() !== '') {
                    return;
                }
            }
            if (retry === retryNumber) {
                throw new Error('Timed out waiting for table cell to have data');
            }
            retry++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await isValueOfCellDisplayed(retry);
        };
        await isValueOfCellDisplayed();
    }
}
