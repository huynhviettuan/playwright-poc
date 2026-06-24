import { type BaseControl } from '@elements/base/base-control';
import { expect as baseExpect, type Locator } from '@playwright/test';
import * as fs from 'fs/promises';
import path from 'path';
import { SortDirectionEnum } from 'src/enums/common.enum';
export { test } from '@playwright/test';

type MatcherResult = { message: () => string; pass: boolean };

async function assertLocator(
    locator: Locator,
    isNot: boolean,
    assertFn: (e: ReturnType<typeof baseExpect<Locator>>) => Promise<void>,
    description: string
): Promise<MatcherResult> {
    const locatorExpect = isNot ? baseExpect(locator).not : baseExpect(locator);
    try {
        await assertFn(locatorExpect);
        return { message: () => `expected element not ${description}`, pass: !isNot };
    } catch {
        return { message: () => `expected element ${description}`, pass: isNot };
    }
}

export const expect = baseExpect.extend({
    async toBeVisible(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeVisible(), 'to be visible');
    },

    async toBeHidden(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeHidden(), 'to be hidden');
    },

    async toBeEnabled(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeEnabled(), 'to be enabled');
    },

    async toBeDisabled(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeDisabled(), 'to be disabled');
    },

    async toBeEditable(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeEditable(), 'to be editable');
    },

    async toBeChecked(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeChecked(), 'to be checked');
    },

    async toBeFocused(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeFocused(), 'to be focused');
    },

    async toBeAttached(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeAttached(), 'to be attached');
    },

    async toBeInViewport(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeInViewport(), 'to be in viewport');
    },

    async toBeEmpty(element: BaseControl) {
        return assertLocator(element.element, this.isNot, (e) => e.toBeEmpty(), 'to be empty');
    },

    async toHaveText(element: BaseControl, expected: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveText(expected),
            `to have text "${String(expected)}"`
        );
    },

    async toContainText(element: BaseControl, expected: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toContainText(expected),
            `to contain text "${String(expected)}"`
        );
    },

    async toHaveAttribute(element: BaseControl, name: string, value: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveAttribute(name, value),
            `to have attribute "${name}" with value "${String(value)}"`
        );
    },

    async toHaveValue(element: BaseControl, expected: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveValue(expected),
            `to have value "${String(expected)}"`
        );
    },

    async toHaveValues(element: BaseControl, expected: (string | RegExp)[]) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveValues(expected),
            `to have values [${expected.map(String).join(', ')}]`
        );
    },

    async toHaveClass(element: BaseControl, expected: string | RegExp | (string | RegExp)[]) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveClass(expected),
            `to have class "${String(expected)}"`
        );
    },

    async toHaveCount(element: BaseControl, expected: number) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveCount(expected),
            `to have count ${expected}`
        );
    },

    async toHaveCSS(element: BaseControl, name: string, value: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveCSS(name, value),
            `to have CSS "${name}" with value "${String(value)}"`
        );
    },

    async toHaveId(element: BaseControl, expected: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveId(expected),
            `to have id "${String(expected)}"`
        );
    },

    async toHaveJSProperty(element: BaseControl, name: string, value: unknown) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveJSProperty(name, value),
            `to have JS property "${name}"`
        );
    },

    async toHaveRole(element: BaseControl, expected: string) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveRole(expected as Parameters<typeof e.toHaveRole>[0]),
            `to have role "${expected}"`
        );
    },

    async toHaveAccessibleName(element: BaseControl, expected: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveAccessibleName(expected),
            `to have accessible name "${String(expected)}"`
        );
    },

    async toHaveAccessibleDescription(element: BaseControl, expected: string | RegExp) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toHaveAccessibleDescription(expected),
            `to have accessible description "${String(expected)}"`
        );
    },

    async toContainClass(element: BaseControl, expected: string | readonly string[]) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toContainClass(expected),
            `to contain class "${String(expected)}"`
        );
    },

    async toMatchAriaSnapshot(element: BaseControl, expected: string) {
        return assertLocator(
            element.element,
            this.isNot,
            (e) => e.toMatchAriaSnapshot(expected),
            'to match aria snapshot'
        );
    },

    // Utility matchers (non-element, no retry needed)
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
