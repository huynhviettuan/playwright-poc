import { test as a11yFixtures } from '@fixtures/accessibility-fixtures';
import { test as databaseFixtures } from '@fixtures/database-fixtures';
import { test as hookFixtures } from '@fixtures/hook-fixtures';
import { test as pdfFixtures } from '@fixtures/pdf-fixtures';
import { test as roleFixtures } from '@fixtures/role-fixtures';
import { test as wordFixtures } from '@fixtures/word-fixtures';
import { mergeExpects, mergeTests } from '@playwright/test';
import { test as commandFixtures } from 'src/fixtures/command-fixtures';
import { expect as expectFixtures } from 'src/fixtures/expect-fixtures';
import { test as notificationFixtures } from 'src/fixtures/notification-fixtures';
import { test as pageFixtures } from 'src/fixtures/page-fixtures';
import { test as serviceFixtures } from 'src/fixtures/service-fixtures';

export const test = mergeTests(
    serviceFixtures,
    commandFixtures,
    pageFixtures,
    notificationFixtures,
    hookFixtures,
    a11yFixtures,
    databaseFixtures,
    roleFixtures,
    pdfFixtures,
    wordFixtures
);
export const expect = mergeExpects(expectFixtures);
