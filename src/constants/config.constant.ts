import { config } from 'dotenv';

config();

const getEnv = (key: string, defaultValue: string = ''): string => {
    return (process.env[key] || defaultValue).trim();
};

export const Config = {
    report: {
        apiKey: getEnv('REPORT_API_KEY'),
        endpoint: getEnv('REPORT_ENDPOINT'),
        launch: getEnv('REPORT_LAUNCH')
    },
    api: {
        domain: getEnv('API_DOMAIN')
    },
    auth: {
        password: getEnv('PASSWORD'),
        superAdminEmail: getEnv('SUPER_ADMIN_EMAIL')
    },
    app: {
        baseUrl: getEnv('BASE_URL'),
        mailDomain: getEnv('MAIL_DOMAIN')
    }
} as const;

export const REPORT_API_KEY = Config.report.apiKey;
export const REPORT_ENDPOINT = Config.report.endpoint;
export const REPORT_LAUNCH = Config.report.launch;
export const API_DOMAIN = Config.api.domain;
export const PASSWORD = Config.auth.password;
export const SUPER_ADMIN_EMAIL = Config.auth.superAdminEmail;
export const MAIL_DOMAIN = Config.app.mailDomain;
export const BASE_URL = Config.app.baseUrl;
