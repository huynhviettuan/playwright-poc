import { test as base } from '@playwright/test';
import { TokensService } from '@services/tokens.service';

type ServiceObjects = {
    tokensService: TokensService;
};

export const test = base.extend<ServiceObjects>({
    tokensService: async ({}, use) => {
        await use(new TokensService());
    }
});
