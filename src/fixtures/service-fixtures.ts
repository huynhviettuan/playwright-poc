import { test as base } from '@playwright/test';
import { TokensService } from '@services/tokens.service';
import { UserOrganizationService } from '@services/user-organization.service';

type ServiceObjects = {
    tokensService: TokensService;
    userOrganizationService: UserOrganizationService;
};

export const test = base.extend<ServiceObjects>({
    tokensService: async ({}, use) => {
        await use(new TokensService());
    },
    userOrganizationService: async ({}, use) => {
        await use(new UserOrganizationService());
    }
});
