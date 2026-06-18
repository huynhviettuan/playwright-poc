import { DateCalculation } from './calculation';
import { DateFormatting } from './formatting';
import { DateValidation } from './validation';

export class DateTimeHelper {
    // Formatting
    static today = DateFormatting.today;
    static fromUnix = DateFormatting.fromUnix;
    static getMonth = DateFormatting.getMonth;
    static getYear = DateFormatting.getYear;

    // Calculation
    static addDays = DateCalculation.addDays;
    static subtractDays = DateCalculation.subtractDays;
    static todayUnix = DateCalculation.todayUnix;
    static subtractDaysUnix = DateCalculation.subtractDaysUnix;
    static endOfDayUnix = DateCalculation.endOfDayUnix;
    static toUnix = DateCalculation.toUnix;

    // Validation
    static isValidFormat = DateValidation.isValidFormat;
    static randomTimestamp = DateValidation.randomTimestamp;
}
