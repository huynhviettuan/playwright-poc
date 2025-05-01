export interface IDateRangePicker {
    selectYear(year: number): Promise<void>;
    selectLeftCalendarDay(day: number): Promise<void>;
    selectRightCalendarDay(day: number): Promise<void>;
    selectMonth(month: number): Promise<void>;
    selectTime(from: string, to: string): Promise<void>;
}
