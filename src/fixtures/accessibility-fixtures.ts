import { AccessibilityHelper } from '@helpers/accessibility.helper';
import { type A11yScanOptions } from '@models/accessibility/accessibility.interface';
import { test as base } from '@playwright/test';

type AccessibilityFixtures = {
    a11y: AccessibilityHelper;
    a11yOptions: A11yScanOptions;
};

export const test = base.extend<AccessibilityFixtures>({
    a11yOptions: [{}, { option: true }],

    a11y: async ({ a11yOptions }, use) => {
        await use(new AccessibilityHelper(a11yOptions));
    }
});
