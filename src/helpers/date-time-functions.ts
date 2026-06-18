import { DATE_FORMAT_DMY } from '@constants/common.constant';
import moment, { Moment } from 'moment';
import { DataGenerator } from './generate-data-functions';

export class DateTimeHelper {
    private static now(): Moment {
        return moment();
    }

    static addDays(days: number, format: string = DATE_FORMAT_DMY): string {
        return this.now().add(days, 'days').format(format);
    }

    static subtractDays(days: number, format: string = DATE_FORMAT_DMY): string {
        return this.now().subtract(days, 'days').format(format);
    }

    static today(format: string = DATE_FORMAT_DMY): string {
        return this.now().format(format);
    }

    static isValidFormat(date: string, format: string): boolean {
        return moment(date, format, true).isValid();
    }

    static toUnix(date: string): number {
        return moment(date).unix();
    }

    static fromUnix(timestamp: number, format: string = DATE_FORMAT_DMY): string {
        return moment.unix(timestamp).format(format);
    }

    static todayUnix(): number {
        return this.now().unix();
    }

    static endOfDayUnix(date: string): number {
        return moment(date).endOf('day').unix();
    }

    static subtractDaysUnix(days: number): number {
        return this.now().subtract(days, 'days').unix();
    }

    static randomTimestamp(): string {
        return String(Date.now() + DataGenerator.randomNumber());
    }

    static getMonth(date: string, dateFormat: string = DATE_FORMAT_DMY, monthFormat: string = 'MM'): string {
        return moment(date, dateFormat).format(monthFormat);
    }

    static getYear(date: string, dateFormat: string = DATE_FORMAT_DMY): string {
        return moment(date, dateFormat).format('YYYY');
    }
}
