export interface IDatePicker {
    selectYear(year: number): Promise<void>;
    selectDay(day: number): Promise<void>;
    selectMonth(month: number): Promise<void>;
    selectTime(time: string): Promise<void>;
}
