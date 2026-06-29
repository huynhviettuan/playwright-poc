import { BrowserInstance } from '@common/browser';
import { Config } from '@constants/config.constant';
import { Role } from '@enums/role.enum';
import { test as base } from '@playwright/test';
import { ApiCommands } from 'src/commands/api-commands';
import { Commands } from 'src/commands/commands';

const ROLE_EMAILS: Record<Role, string> = {
    [Role.SuperAdmin]: Config.auth.superAdminEmail,
    [Role.StandardUser]: Config.auth.standardUserEmail
};

interface SwitchRoleOptions {
    useUi?: boolean;
}

type RoleFixtures = {
    logout: () => Promise<void>;
    switchRole: (role: Role, options?: SwitchRoleOptions) => Promise<void>;
};

export const test = base.extend<RoleFixtures>({
    logout: async ({}, use) => {
        const logoutFn = async (): Promise<void> => {
            const page = BrowserInstance.currentPage;
            const context = BrowserInstance.currentContext;

            await context.clearCookies();
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            await page.goto(Config.app.baseUrl);
        };

        await use(logoutFn);
    },

    switchRole: async ({}, use) => {
        const switchRoleFn = async (role: Role, options?: SwitchRoleOptions): Promise<void> => {
            const page = BrowserInstance.currentPage;
            const context = BrowserInstance.currentContext;
            const email = ROLE_EMAILS[role];

            await context.clearCookies();
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            if (options?.useUi) {
                const commands = new Commands();
                await commands.loginWithUser(email);
            } else {
                const apiCommands = new ApiCommands();
                const token = await apiCommands.getAuthorizationToken(email);

                await context.addCookies([
                    {
                        name: 'auth_token',
                        value: token,
                        url: Config.app.baseUrl
                    }
                ]);

                await page.reload();
            }
        };

        await use(switchRoleFn);
    }
});
