import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import _ from 'lodash';
import * as path from 'path';
import { getRandomTimeStamp } from './date-time-functions';

export function generateRandomString(length = 10): string {
    return faker.string.alpha(length);
}

export function generateRandomNumber(min = 1, max = 100000): number {
    return _.random(min, max);
}

export function generateRandomEmail(): string {
    return `automation+${getRandomTimeStamp()}@gmail.com`;
}

export function cloneFile(
    fileName: string,
    folderPath: string = 'src/data/files',
    destinationFolder: string = 'src/downloads'
): void {
    try {
        const sourcePath = path.resolve(folderPath, fileName);
        const destinationPath = path.resolve(destinationFolder, fileName);
        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });
        }
        fs.copyFileSync(sourcePath, destinationPath);
    } catch (error) {
        console.error(`Failed to clone file: ${error}`);
    }
}
