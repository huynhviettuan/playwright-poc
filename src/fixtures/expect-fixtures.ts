import { expect as baseExpect } from '@playwright/test';
import * as fs from 'fs/promises';
import path from 'path';
import { SortDirectionEnum } from 'src/enums/common.enum';
export { test } from '@playwright/test';

export const expect = baseExpect.extend({
    toBeOneOfValues<T>(received: T, array: T[]) {
        const pass = array.includes(received);
        if (pass) {
            return {
                message: () => 'passed',
                pass: true
            };
        }
        return {
            message: () => `toBeOneOfValues() assertion failed.\nYou expected [${array}] to include '${received}'\n`,
            pass: false
        };
    },
    toBeSorted(received: string[], sortOption: SortDirectionEnum) {
        const pass =
            sortOption === SortDirectionEnum.ASCENDING
                ? received.sort().slice().join(',') === received.join(',')
                : received.sort().reverse().slice().join(',') === received.join(',');
        if (pass) {
            return {
                message: () => 'passed',
                pass: true
            };
        }
        return {
            message: () => `data ${received} not to be sorted`,
            pass: false
        };
    },
    async toBeExistInDownloadsFolder(fileName: string) {
        const filePath: string = path.join('src', 'downloads', fileName);
        const pass = await fs
            .access(filePath)
            .then(() => true)
            .catch(() => false);
        if (pass) {
            return {
                message: () => 'passed',
                pass: true
            };
        }
        return {
            message: () => `${filePath} not exist`,
            pass: false
        };
    }
});
