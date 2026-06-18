export const Paths = {
    downloads: 'src/downloads/',
    files: 'src/data/files/',
    images: 'src/data/images/'
} as const;

export const Timeouts = {
    long: 35000
} as const;

export const Pagination = {
    defaultPerPage: 10,
    defaultPageIndex: 1
} as const;

export const DateFormats = {
    dayMonthYear: 'DD/MM/YYYY',
    monthDayYear: 'MM/DD/YYYY',
    timestamp: 'D MMM YYYY HH_mm'
} as const;

export const DOWNLOADS_PATH = Paths.downloads;
export const FILES_PATH = Paths.files;
export const IMAGES_PATH = Paths.images;
export const LONG_TIMEOUT = Timeouts.long;
export const PER_PAGE_DEFAULT = Pagination.defaultPerPage;
export const PAGE_DEFAULT_INDEX = Pagination.defaultPageIndex;
export const DATE_FORMAT_DMY = DateFormats.dayMonthYear;
export const DATE_FORMAT_MDY = DateFormats.monthDayYear;
export const TIME_FORMAT = DateFormats.timestamp;
