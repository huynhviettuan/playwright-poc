import { DatabaseHelper } from '@helpers/database.helper';
import { test as base } from '@playwright/test';

type DatabaseFixtures = {
    db: DatabaseHelper;
};

export const test = base.extend<DatabaseFixtures>({
    db: async ({}, use) => {
        const db = new DatabaseHelper();
        await use(db);
        await db.cleanup();
        await db.close();
    }
});
