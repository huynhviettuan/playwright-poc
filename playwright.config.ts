import { defineConfig, devices } from '@playwright/test';
import { REPORT_API_KEY, REPORT_ENDPOINT, REPORT_LAUNCH } from 'src/constants/config.constant';

const RPconfig = {
    apiKey: REPORT_API_KEY,
    endpoint: REPORT_ENDPOINT,
    project: 'Demo',
    launch: REPORT_LAUNCH,
    includeTestSteps: true,
    restClientConfig: {
        timeout: 60000
    }
};

export default defineConfig({
    testDir: './tests/.',
    timeout: 360000,
    expect: {
        timeout: 15000
    },
    use: {
        actionTimeout: 20000,
        headless: !!process.env.CI,
        baseURL: process.env.BASE_URL,
        launchOptions: {
            args: ['--start-maximized']
        },
        testIdAttribute: 'data-testid',
        screenshot: 'only-on-failure',
        ignoreHTTPSErrors: true
    },
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 4 : 2,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    projects: [
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] }
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
        },

        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] }
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] }
        },
        {
            name: 'Microsoft Edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' }
        },
        {
            name: 'chrome',
            use: { channel: 'chrome', viewport: process.env.CI ? { height: 1080, width: 1920 } : null }
        },
        {
            name: 'e2e',
            use: { channel: 'chrome', viewport: { height: 1080, width: 1920 } },
            testDir: './tests/e2e/.'
        },
        {
            name: 'api',
            use: { channel: 'chrome', viewport: { height: 1080, width: 1920 } },
            testDir: './tests/api/.'
        }
    ],
    reporter: process.env.CI ? [['@reportportal/agent-js-playwright', RPconfig]] : undefined
});
