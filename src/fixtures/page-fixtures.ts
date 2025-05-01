import { SignInPage } from '@pages/sign-in';
import { test as base } from '@playwright/test';

type PageObjects = {
    signInPage: SignInPage;
};

export const test = base.extend<PageObjects>({
    signInPage: async ({}, use) => {
        await use(new SignInPage());
    }
});
