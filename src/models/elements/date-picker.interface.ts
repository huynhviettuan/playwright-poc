export interface IDatePicker {
    selectDate(dateString: string, format?: string): Promise<void>;
}
