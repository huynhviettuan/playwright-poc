import { BrowserInstance } from '@common/browser';
import { $ } from '@common/element.function';
import { DateFormats } from '@constants/common.constant';
import { DateTimeHelper } from '@helpers/date-time-functions';
import { type IDatePicker } from '@models/elements/date-picker.interface';
import { type Locator } from '@playwright/test';

import { Button } from './button';
import { Image } from './image';
import { Label } from './label';

interface ParsedDate {
    year: number;
    month: number;
    day: number;
}

class CalendarNavigation {
    constructor(
        private readonly imgBack: Image,
        private readonly imgDoubleBack: Image,
        private readonly imgNext: Image,
        private readonly imgDoubleNext: Image
    ) {}

    async navigateYears(targetYear: number, currentYear: number): Promise<void> {
        if (currentYear === targetYear) return;

        if (currentYear > targetYear) {
            await this.imgDoubleBack.click();
        } else {
            await this.imgDoubleNext.click();
        }
    }

    async navigateMonths(targetMonth: number, currentMonth: number): Promise<void> {
        if (currentMonth === targetMonth) return;

        if (currentMonth > targetMonth) {
            await this.imgBack.click();
        } else {
            await this.imgNext.click();
        }
    }
}

class CalendarParser {
    private static readonly MONTHS = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];

    static parseDate(dateString: string, format: string): ParsedDate {
        return {
            year: Number(DateTimeHelper.getYear(dateString, format)),
            month: Number(DateTimeHelper.getMonth(dateString, format, 'M')),
            day: Number(DateTimeHelper.getMonth(dateString, format, 'D'))
        };
    }

    static parseYear(headerText: string): number {
        const yearMatch = /\d+$/g.exec(headerText);
        return yearMatch ? Number(yearMatch[0]) : 0;
    }

    static parseMonth(headerText: string): number {
        const monthText = headerText.replace(/[^a-zA-Z]+/g, '');
        return this.MONTHS.indexOf(monthText) + 1;
    }
}

export class DatePicker implements IDatePicker {
    private readonly datePicker: Locator;
    private readonly calendar: Locator;
    private readonly navigation: CalendarNavigation;
    private readonly lblHeader: Label;
    private readonly lblDay: Label;
    private readonly btnToday: Button;

    constructor(label: string, parentLocator?: Locator, id?: string) {
        this.datePicker = id
            ? (parentLocator || BrowserInstance.currentPage).locator(`#${id}`)
            : parentLocator
              ? parentLocator.locator('.date-picker', { hasText: label })
              : $('.date-picker');

        this.calendar = $('.popup');

        this.navigation = new CalendarNavigation(
            new Image({ locator: this.calendar.locator('.back') }),
            new Image({ locator: this.calendar.locator('.double-back') }),
            new Image({ locator: this.calendar.locator('.next') }),
            new Image({ locator: this.calendar.locator('.double-next') })
        );

        this.lblHeader = new Label({ parentLocator: this.calendar, locator: '.header' });
        this.lblDay = new Label({ parentLocator: this.calendar, locator: '.day' });
        this.btnToday = new Button({ label: 'Today', parentLocator: this.calendar });
    }

    async selectDate(dateString: string, format: string = DateFormats.dayMonthYear): Promise<void> {
        this.validateDateFormat(dateString, format);

        const { year, month, day } = CalendarParser.parseDate(dateString, format);

        await this.datePicker.click();
        await this.selectYear(year);
        await this.selectMonth(month);
        await this.selectDay(day);
    }

    private validateDateFormat(dateString: string, format: string): void {
        if (!DateTimeHelper.isValidFormat(dateString, format)) {
            throw new Error(`Invalid date format. Expected: ${format}`);
        }
    }

    private async selectYear(targetYear: number): Promise<void> {
        const currentYear = await this.getCurrentYear();
        if (currentYear === targetYear) return;

        await this.navigation.navigateYears(targetYear, currentYear);
        await this.selectYear(targetYear);
    }

    private async selectMonth(targetMonth: number): Promise<void> {
        const currentMonth = await this.getCurrentMonth();
        if (currentMonth === targetMonth) return;

        await this.navigation.navigateMonths(targetMonth, currentMonth);
        await this.selectMonth(targetMonth);
    }

    private async selectDay(day: number): Promise<void> {
        await this.lblDay.getByText(day.toString(), { exact: true }).click();
    }

    private async getCurrentYear(): Promise<number> {
        const headerText = await this.lblHeader.getTextContent();
        return CalendarParser.parseYear(headerText);
    }

    private async getCurrentMonth(): Promise<number> {
        const headerText = await this.lblHeader.getTextContent();
        return CalendarParser.parseMonth(headerText);
    }
}
