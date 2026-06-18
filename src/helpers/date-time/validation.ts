import moment from 'moment';
import { DataGenerator } from '@helpers/generate-data-functions';

export class DateValidation {
    static isValidFormat(date: string, format: string): boolean {
        return moment(date, format, true).isValid();
    }

    static randomTimestamp(): string {
        return String(Date.now() + DataGenerator.randomNumber());
    }
}
