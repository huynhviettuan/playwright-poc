import moment, { Moment } from 'moment';

export class DateFormatting {
    private static now(): Moment {
        return moment();
    }

    static today(format: string = 'DD/MM/YYYY'): string {
        return this.now().format(format);
    }

    static fromUnix(timestamp: number, format: string = 'DD/MM/YYYY'): string {
        return moment.unix(timestamp).format(format);
    }

    static getMonth(date: string, dateFormat: string = 'DD/MM/YYYY', monthFormat: string = 'MM'): string {
        return moment(date, dateFormat).format(monthFormat);
    }

    static getYear(date: string, dateFormat: string = 'DD/MM/YYYY'): string {
        return moment(date, dateFormat).format('YYYY');
    }
}
