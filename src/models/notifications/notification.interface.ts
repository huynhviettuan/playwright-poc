export type TestStatus = 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';

export type TestResultDetail = {
    title: string;
    suite: string;
    status: TestStatus;
    duration: number;
    error?: string;
    retry: number;
};

export type TestRunSummary = {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
    duration: number;
    startedAt: string;
    finishedAt: string;
    project: string;
    branch?: string;
    commitSha?: string;
    runUrl?: string;
    failedTests: TestResultDetail[];
};

export type NotificationPayload = {
    summary: TestRunSummary;
    formatted: {
        title: string;
        body: string;
        color: string;
    };
};

export type NotificationEvent = 'test:completed' | 'test:failed' | 'suite:finished';

export type NotificationChannelConfig = {
    type: 'slack' | 'teams' | 'email' | 'webhook';
    enabled: boolean;
    url?: string;
    token?: string;
    recipients?: string[];
    onlyOnFailure?: boolean;
};

export type NotificationConfig = {
    enabled: boolean;
    channels: NotificationChannelConfig[];
};
