import { type BaseControl } from '@elements/base/base-control';
import { expect as baseExpect } from '@playwright/test';
import * as fs from 'fs/promises';
import path from 'path';
import { SortDirectionEnum } from 'src/enums/common.enum';
export { test } from '@playwright/test';

export const expect = baseExpect.extend({
    // Element matchers
    async toBeVisible(element: BaseControl) {
        const isVisible = await element.isVisible();
        return {
            message: () => `expected element to be visible`,
            pass: isVisible
        };
    },

    async toBeHidden(element: BaseControl) {
        const isHidden = await element.isHidden();
        return {
            message: () => `expected element to be hidden`,
            pass: isHidden
        };
    },

    async toBeEnabled(element: BaseControl) {
        const isEnabled = await element.isEnabled();
        return {
            message: () => `expected element to be enabled`,
            pass: isEnabled
        };
    },

    async toBeDisabled(element: BaseControl) {
        const isDisabled = await element.isDisabled();
        return {
            message: () => `expected element to be disabled`,
            pass: isDisabled
        };
    },

    async toHaveText(element: BaseControl, expectedText: string) {
        const actualText = await element.getTextContent();
        const pass = actualText === expectedText;
        return {
            message: () => `expected "${actualText}" to equal "${expectedText}"`,
            pass
        };
    },

    async toContainText(element: BaseControl, expectedText: string) {
        const actualText = await element.getTextContent();
        const pass = actualText?.includes(expectedText);
        return {
            message: () => `expected "${actualText}" to contain "${expectedText}"`,
            pass
        };
    },

    async toHaveAttribute(element: BaseControl, name: string, value: string | RegExp) {
        const actual = await element.getAttribute(name);
        const pass = value instanceof RegExp ? value.test(actual) : actual === value;
        return {
            message: () => `expected attribute "${name}" to be "${String(value)}" but got "${actual}"`,
            pass
        };
    },

    async toHaveValue(element: BaseControl, expectedValue: string) {
        const actual = await element.element.inputValue();
        const pass = actual === expectedValue;
        return {
            message: () => `expected value "${expectedValue}" but got "${actual}"`,
            pass
        };
    },

    async toBeChecked(element: BaseControl) {
        const isChecked = await element.isChecked();
        return {
            message: () => `expected element to be checked`,
            pass: isChecked
        };
    },

    // Existing custom matchers
    toBeOneOfValues<T>(received: T, array: T[]) {
        const pass = array.includes(received);
        if (pass) {
            return {
                message: () => 'passed',
                pass: true
            };
        }
        return {
            message: () =>
                `toBeOneOfValues() assertion failed.\nYou expected [${String(array)}] to include '${String(received)}'\n`,
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
            message: () => `data ${String(received)} not to be sorted`,
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
