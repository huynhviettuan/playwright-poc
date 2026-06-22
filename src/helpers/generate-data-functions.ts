import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';

import { DateTimeHelper } from './date-time-functions';

export class DataGenerator {
    static randomString(length: number = 10): string {
        return faker.string.alpha(length);
    }

    static randomNumber(min: number = 1, max: number = 100000): number {
        return faker.number.int({ min, max });
    }

    static randomEmail(prefix: string = 'automation'): string {
        return `${prefix}+${DateTimeHelper.randomTimestamp()}@gmail.com`;
    }

    static randomName(): string {
        return faker.person.fullName();
    }

    static randomPhone(): string {
        return faker.phone.number();
    }

    static randomAddress(): string {
        return faker.location.streetAddress();
    }
}

export class FileHelper {
    static clone(
        fileName: string,
        sourceFolder: string = 'src/data/files',
        destinationFolder: string = 'src/downloads'
    ): void {
        const sourcePath = path.resolve(sourceFolder, fileName);
        const destinationPath = path.resolve(destinationFolder, fileName);

        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });
        }

        fs.copyFileSync(sourcePath, destinationPath);
    }

    static exists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    static delete(filePath: string): void {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}
