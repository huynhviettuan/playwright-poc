import { $ } from '@common/element.function';
import { DATE_FORMAT_DMY } from '@constants/common.constant';
import { IDatePicker } from '@models/elements/date-picker.interface';
import moment from 'moment';
import { Locator } from 'playwright-core';
import { Button } from './button';
import { Image } from './image';
import { Label } from './label';

export class DatePicker implements IDatePicker {
    cpnDatePicker: Locator;
    cpnCalendar: Locator;
    imgBack: Image;
    imgDoubleBack: Image;
    imgNext: Image;
    imgDoubleNext: Image;
    lblCalendarHeader: Label;
    lblDay: Label;
    btnToday: Button;

    constructor(label: string, parentLocator?: Locator) {
        this.cpnDatePicker = parentLocator
            ? parentLocator.locator('.date-picker', { hasText: label })
            : $('.date-picker');
        this.cpnCalendar = $('.popup');
        this.imgBack = new Image({
            locator: this.cpnCalendar.locator('.back')
        });
        this.imgDoubleBack = new Image({
            locator: this.cpnCalendar.locator('.double-back')
        });
        this.imgNext = new Image({
            locator: this.cpnCalendar.locator('.next')
        });
        this.imgDoubleNext = new Image({
            locator: this.cpnCalendar.locator('.double-mext')
        });
        this.lblCalendarHeader = new Label({
            parentLocator: this.cpnCalendar,
            locator: '.header'
        });
        this.lblDay = new Label({
            parentLocator: this.cpnCalendar,
            locator: '.day'
        });
        this.btnToday = new Button({
            label: 'Today',
            parentLocator: this.cpnCalendar
        });
    }

    async selectYear(year: number): Promise<void> {
        const displayedYear = Number(/\d+$/g.exec(await this.lblCalendarHeader.getTextContent())[0]);
        if (displayedYear === year) return;
        if (displayedYear > year) await this.imgDoubleBack.click();
        else await this.imgDoubleNext.click();
        await this.selectYear(year);
    }

    async selectDay(day: number): Promise<void> {
        await this.lblDay.getByText(day.toString(), { exact: true }).click();
    }

    async selectMonth(month: number): Promise<void> {
        const monthNames: string[] = [
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

        const displayedMonth =
            monthNames.indexOf((await this.lblCalendarHeader.getTextContent()).replace(/[^a-zA-Z]+/g, '')) + 1;
        if (displayedMonth === month) return;
        if (displayedMonth > month) await this.imgBack.click();
        else await this.imgNext.click();
        await this.selectMonth(month);
    }

    async selectTime(time: string): Promise<void> {
        if (!moment(time, DATE_FORMAT_DMY, true).isValid()) throw new Error('The time is incorrect format');
        const [year, month, day] = [
            moment(time, DATE_FORMAT_DMY).year(),
            moment(time, DATE_FORMAT_DMY).month() + 1,
            moment(time, DATE_FORMAT_DMY).date()
        ];
        await this.cpnDatePicker.click();
        await this.selectYear(year);
        await this.selectMonth(month);
        await this.selectDay(day);
    }
}
