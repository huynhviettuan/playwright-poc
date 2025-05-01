import { test as base } from '@playwright/test';
import { ApiCommands } from 'src/commands/api-commands';
import { Commands } from 'src/commands/commands';

type CommandObjects = {
    apiCommands: ApiCommands;
    commands: Commands;
};

export const test = base.extend<CommandObjects>({
    apiCommands: async ({}, use) => {
        await use(new ApiCommands());
    },
    commands: async ({}, use) => {
        await use(new Commands());
    }
});
