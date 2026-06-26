import AxeBuilder from '@axe-core/playwright';
import { BrowserInstance } from '@common/browser';
import { type A11yScanOptions, type A11yViolation } from '@models/accessibility/accessibility.interface';
import { type AxeResults, type Result } from 'axe-core';

export class AccessibilityHelper {
    private readonly options: A11yScanOptions;

    constructor(options: A11yScanOptions = {}) {
        this.options = options;
    }

    async scan(options?: A11yScanOptions): Promise<AxeResults> {
        const merged = { ...this.options, ...options };
        let builder = new AxeBuilder({ page: BrowserInstance.currentPage });

        if (merged.includeTags?.length) {
            builder = builder.withTags(merged.includeTags);
        }

        if (merged.rules?.length) {
            builder = builder.withRules(merged.rules.filter((r) => r.enabled).map((r) => r.id));
            builder = builder.disableRules(merged.rules.filter((r) => !r.enabled).map((r) => r.id));
        }

        if (merged.exclude?.length) {
            for (const selector of merged.exclude) {
                builder = builder.exclude(selector);
            }
        }

        if (merged.include?.length) {
            for (const selector of merged.include) {
                builder = builder.include(selector);
            }
        }

        return builder.analyze();
    }

    static formatViolations(results: AxeResults): A11yViolation[] {
        return results.violations.map((v) => AccessibilityHelper.toViolation(v));
    }

    static filterByImpact(results: AxeResults, threshold: string): Result[] {
        const levels = ['minor', 'moderate', 'serious', 'critical'];
        const minIndex = levels.indexOf(threshold);
        return results.violations.filter((v) => levels.indexOf(v.impact ?? 'minor') >= minIndex);
    }

    static buildReport(results: AxeResults): string {
        if (!results.violations.length) return 'No accessibility violations found.';

        const lines = results.violations.map((v) => {
            const nodes = v.nodes.length;
            return `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${nodes} instance${nodes > 1 ? 's' : ''})`;
        });

        return [`${results.violations.length} violation(s) found:\n`, ...lines].join('\n');
    }

    private static toViolation(result: Result): A11yViolation {
        return {
            id: result.id,
            impact: result.impact ?? 'unknown',
            description: result.description,
            helpUrl: result.helpUrl,
            nodes: result.nodes.length
        };
    }
}
