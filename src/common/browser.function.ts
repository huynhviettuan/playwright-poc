import { BrowserInstance } from './browser';

export function initDesktopOrMobile<T>(desktop: T, mobile: T): T {
    return BrowserInstance.isContextMobile ? mobile : desktop;
}
