import {
    type NotificationChannelConfig,
    type NotificationConfig,
    type TestResultDetail,
    type TestRunSummary
} from '@models/notifications/notification.interface';
import { NotificationFormatter } from '@notifications/formatter';
import { NotificationManager } from '@notifications/notification-manager';
import {
    type FullConfig,
    type FullResult,
    type Reporter,
    type Suite,
    type TestCase,
    type TestResult
} from '@playwright/test/reporter';

export class NotificationReporter implements Reporter {
    private readonly results: TestResultDetail[] = [];
    private startTime: Date;
    private project: string = '';

    constructor(private readonly config: NotificationConfig) {}

    onBegin(config: FullConfig, _suite: Suite): void {
        this.startTime = new Date();
        this.project = config.projects[0]?.name ?? 'unknown';
        NotificationManager.initialize(this.config);
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        this.results.push({
            title: test.title,
            suite: test.parent.title,
            status: result.status,
            duration: result.duration,
            error: result.errors?.[0]?.message?.substring(0, 500),
            retry: result.retry
        });
    }

    async onEnd(result: FullResult): Promise<void> {
        const finalResults = this.deduplicateRetries(this.results);

        const summary: TestRunSummary = {
            totalTests: finalResults.length,
            passed: finalResults.filter((r) => r.status === 'passed').length,
            failed: finalResults.filter((r) => r.status === 'failed').length,
            skipped: finalResults.filter((r) => r.status === 'skipped').length,
            timedOut: finalResults.filter((r) => r.status === 'timedOut').length,
            duration: result.duration,
            startedAt: this.startTime.toISOString(),
            finishedAt: new Date().toISOString(),
            project: this.project,
            branch: process.env.GITHUB_REF_NAME ?? process.env.CI_COMMIT_BRANCH,
            commitSha: process.env.GITHUB_SHA ?? process.env.CI_COMMIT_SHA,
            runUrl: NotificationReporter.buildRunUrl(),
            failedTests: finalResults.filter((r) => r.status === 'failed')
        };

        const payload = NotificationFormatter.format(summary);
        await NotificationManager.notify(payload);
    }

    private deduplicateRetries(results: TestResultDetail[]): TestResultDetail[] {
        const lastAttempt = new Map<string, TestResultDetail>();
        for (const result of results) {
            const key = `${result.suite}::${result.title}`;
            const existing = lastAttempt.get(key);
            if (!existing || result.retry > existing.retry) {
                lastAttempt.set(key, result);
            }
        }
        return Array.from(lastAttempt.values());
    }

    private static buildRunUrl(): string | undefined {
        if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
            return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
        }
        if (process.env.CI_PROJECT_URL && process.env.CI_PIPELINE_ID) {
            return `${process.env.CI_PROJECT_URL}/-/pipelines/${process.env.CI_PIPELINE_ID}`;
        }
        return undefined;
    }
}

export function createNotificationReporter(channels: NotificationChannelConfig[]): NotificationConfig {
    return {
        enabled: true,
        channels
    };
}
