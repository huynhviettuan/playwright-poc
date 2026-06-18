import moment, { Moment } from 'moment';

export class DateCalculation {
    private static now(): Moment {
        return moment();
    }

    static addDays(days: number, format: string = 'DD/MM/YYYY'): string {
        return this.now().add(days, 'days').format(format);
    }

    static subtractDays(days: number, format: string = 'DD/MM/YYYY'): string {
        return this.now().subtract(days, 'days').format(format);
    }

    static todayUnix(): number {
        return this.now().unix();
    }

    static subtractDaysUnix(days: number): number {
        return this.now().subtract(days, 'days').unix();
    }

    static endOfDayUnix(date: string): number {
        return moment(date).endOf('day').unix();
    }

    static toUnix(date: string): number {
        return moment(date).unix();
    }
}
