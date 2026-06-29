import { DATE_FORMAT_DMY } from '@constants/common.constant';
import {
    addDays as dfnsAddDays,
    endOfDay,
    format,
    fromUnixTime,
    getUnixTime,
    isMatch,
    parse,
    subDays as dfnsSubDays
} from 'date-fns';

import { DataGenerator } from './data-generator';

const MOMENT_TO_DATEFNS: Record<string, string> = {
    DD: 'dd',
    MM: 'MM',
    YYYY: 'yyyy',
    D: 'd',
    M: 'M',
    HH: 'HH',
    mm: 'mm',
    ss: 'ss',
    'D MMM YYYY HH_mm': 'd MMM yyyy HH_mm'
};

function convertFormat(momentFormat: string): string {
    let result = momentFormat;
    const sortedKeys = Object.keys(MOMENT_TO_DATEFNS).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        result = result.split(key).join(MOMENT_TO_DATEFNS[key]);
    }
    return result;
}

export class DateTimeHelper {
    static addDays(days: number, fmt: string = DATE_FORMAT_DMY): string {
        return format(dfnsAddDays(new Date(), days), convertFormat(fmt));
    }

    static subtractDays(days: number, fmt: string = DATE_FORMAT_DMY): string {
        return format(dfnsSubDays(new Date(), days), convertFormat(fmt));
    }

    static today(fmt: string = DATE_FORMAT_DMY): string {
        return format(new Date(), convertFormat(fmt));
    }

    static isValidFormat(date: string, fmt: string): boolean {
        return isMatch(date, convertFormat(fmt));
    }

    static toUnix(date: string): number {
        return getUnixTime(new Date(date));
    }

    static fromUnix(timestamp: number, fmt: string = DATE_FORMAT_DMY): string {
        return format(fromUnixTime(timestamp), convertFormat(fmt));
    }

    static todayUnix(): number {
        return getUnixTime(new Date());
    }

    static endOfDayUnix(date: string): number {
        return getUnixTime(endOfDay(new Date(date)));
    }

    static subtractDaysUnix(days: number): number {
        return getUnixTime(dfnsSubDays(new Date(), days));
    }

    static randomTimestamp(): string {
        return String(Date.now() + DataGenerator.randomNumber());
    }

    static getMonth(date: string, dateFormat: string = DATE_FORMAT_DMY, monthFormat: string = 'MM'): string {
        const parsed = parse(date, convertFormat(dateFormat), new Date());
        return format(parsed, convertFormat(monthFormat));
    }

    static getYear(date: string, dateFormat: string = DATE_FORMAT_DMY): string {
        const parsed = parse(date, convertFormat(dateFormat), new Date());
        return format(parsed, 'yyyy');
    }
}
