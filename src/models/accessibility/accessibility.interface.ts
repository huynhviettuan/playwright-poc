import { type ImpactValue, type TagValue } from 'axe-core';

export interface A11yRuleConfig {
    readonly id: string;
    readonly enabled: boolean;
}

export interface A11yScanOptions {
    readonly includeTags?: TagValue[];
    readonly excludeTags?: TagValue[];
    readonly rules?: A11yRuleConfig[];
    readonly exclude?: string[];
    readonly include?: string[];
    readonly impactThreshold?: ImpactValue;
}

export interface A11yViolation {
    readonly id: string;
    readonly impact: string;
    readonly description: string;
    readonly helpUrl: string;
    readonly nodes: number;
}
