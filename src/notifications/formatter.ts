import { type NotificationPayload, type TestRunSummary } from '@models/notifications/notification.interface';

export class NotificationFormatter {
    static format(summary: TestRunSummary): NotificationPayload {
        const passed = summary.failed === 0;
        const color = passed ? '#2ecc71' : '#e74c3c';
        const statusIcon = passed ? '✅' : '❌';
        const title = `${statusIcon} Test Run ${passed ? 'Passed' : 'Failed'} — ${summary.project}`;

        const lines = [
            `**Total:** ${summary.totalTests} | **Passed:** ${summary.passed} | **Failed:** ${summary.failed} | **Skipped:** ${summary.skipped}`,
            `**Duration:** ${NotificationFormatter.formatDuration(summary.duration)}`,
            `**Started:** ${summary.startedAt}`
        ];

        if (summary.branch) lines.push(`**Branch:** ${summary.branch}`);
        if (summary.commitSha) lines.push(`**Commit:** ${summary.commitSha.substring(0, 7)}`);
        if (summary.runUrl) lines.push(`[View Run](${summary.runUrl})`);

        if (summary.failedTests.length > 0) {
            lines.push('', '**Failed Tests:**');
            for (const test of summary.failedTests.slice(0, 10)) {
                const error = test.error ? ` — ${test.error.substring(0, 100)}` : '';
                lines.push(`- \`${test.suite} > ${test.title}\`${error}`);
            }
            if (summary.failedTests.length > 10) {
                lines.push(`- _...and ${summary.failedTests.length - 10} more_`);
            }
        }

        return {
            summary,
            formatted: { title, body: lines.join('\n'), color }
        };
    }

    private static formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
    }
}
