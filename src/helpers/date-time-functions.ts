import { DATE_FORMAT_DMY } from '@constants/common.constant';
import moment from 'moment';
import { generateRandomNumber } from './generate-data-functions';

export function getDateBefore(day: number): string | undefined {
    if (day) {
        return moment(new Date()).subtract(day, 'day').format(DATE_FORMAT_DMY);
    }
}

export function getDateAfter(day: number): string | undefined {
    if (day) {
        return moment(new Date()).add(day, 'day').format(DATE_FORMAT_DMY);
    }
}

export function isValidDayFormat(day: string, format: string): boolean | undefined {
    if (day && format) {
        return moment(day, format, true).isValid();
    }
}

export function getUnixDateBefore(day: number): number | undefined {
    if (day) {
        return moment(new Date()).subtract(day, 'day').unix();
    }
}

export function getEndOfDay(day: string): number | undefined {
    if (day) {
        return moment(day).endOf('day').unix();
    }
}

export function getToday(format: string = DATE_FORMAT_DMY): string {
    return moment().format(format);
}

export function getTodayUnix(): number {
    return moment(new Date()).unix();
}

export function getRandomTimeStamp(): string {
    return String(new Date().getTime() + generateRandomNumber());
}

export function convertUnixTimestampToDate(unixTimestamp: number, format: string = DATE_FORMAT_DMY): string {
    return moment.unix(unixTimestamp).format(format);
}

export function convertDateToUnix(date: string): number {
    return moment(date).unix();
}

export function getDateBeforeUnix(day: number): number | undefined {
    if (day) {
        return moment(new Date()).subtract(day, 'day').unix();
    }
}

export function getMonths(
    date: string,
    option: {
        dateFormat?: string;
        monthDisplayFormat?: string;
    } = {
        dateFormat: DATE_FORMAT_DMY,
        monthDisplayFormat: 'MM'
    }
): string {
    const { dateFormat, monthDisplayFormat } = option;
    return moment(date, dateFormat).format(monthDisplayFormat);
}

export function getYear(date: string, format: string = DATE_FORMAT_DMY): string {
    return moment(date, format).format('YYYY');
}
