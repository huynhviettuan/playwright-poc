import { Locator } from '@playwright/test';
import { BrowserInstance } from './browser';

export function $(
    selector: string,
    options?: {
        has?: Locator;
        hasNot?: Locator;
        hasNotText?: string | RegExp;
        hasText?: string | RegExp;
    }
): Locator {
    return BrowserInstance.currentPage.locator(selector, options);
}

export function $getByAltText(
    selector: string,
    options?: {
        exact?: boolean;
    }
): Locator {
    return BrowserInstance.currentPage.getByAltText(selector, options);
}

export function $getByPlaceholder(
    selector: string,
    options?: {
        exact?: boolean;
    }
): Locator {
    return BrowserInstance.currentPage.getByPlaceholder(selector, options);
}

export function $getByTestId(testId: string | RegExp): Locator {
    return BrowserInstance.currentPage.getByTestId(testId);
}

export function $getByText(
    text: string | RegExp,
    options?: {
        exact?: boolean;
    }
): Locator {
    return BrowserInstance.currentPage.getByText(text, options);
}

export function $getByTitle(
    text: string | RegExp,
    options?: {
        exact?: boolean;
    }
): Locator {
    return BrowserInstance.currentPage.getByTitle(text, options);
}

export function $getByRole(
    role:
        | 'alert'
        | 'alertdialog'
        | 'application'
        | 'article'
        | 'banner'
        | 'blockquote'
        | 'button'
        | 'caption'
        | 'cell'
        | 'checkbox'
        | 'code'
        | 'columnheader'
        | 'combobox'
        | 'complementary'
        | 'contentinfo'
        | 'definition'
        | 'deletion'
        | 'dialog'
        | 'directory'
        | 'document'
        | 'emphasis'
        | 'feed'
        | 'figure'
        | 'form'
        | 'generic'
        | 'grid'
        | 'gridcell'
        | 'group'
        | 'heading'
        | 'img'
        | 'insertion'
        | 'link'
        | 'list'
        | 'listbox'
        | 'listitem'
        | 'log'
        | 'main'
        | 'marquee'
        | 'math'
        | 'meter'
        | 'menu'
        | 'menubar'
        | 'menuitem'
        | 'menuitemcheckbox'
        | 'menuitemradio'
        | 'navigation'
        | 'none'
        | 'note'
        | 'option'
        | 'paragraph'
        | 'presentation'
        | 'progressbar'
        | 'radio'
        | 'radiogroup'
        | 'region'
        | 'row'
        | 'rowgroup'
        | 'rowheader'
        | 'scrollbar'
        | 'search'
        | 'searchbox'
        | 'separator'
        | 'slider'
        | 'spinbutton'
        | 'status'
        | 'strong'
        | 'subscript'
        | 'superscript'
        | 'switch'
        | 'tab'
        | 'table'
        | 'tablist'
        | 'tabpanel'
        | 'term'
        | 'textbox'
        | 'time'
        | 'timer'
        | 'toolbar'
        | 'tooltip'
        | 'tree'
        | 'treegrid'
        | 'treeitem',
    options?: {
        checked?: boolean;
        disabled?: boolean;
        exact?: boolean;
        expanded?: boolean;
        includeHidden?: boolean;
        level?: number;
        name?: string | RegExp;
        pressed?: boolean;
        selected?: boolean;
    }
): Locator {
    return BrowserInstance.currentPage.getByRole(role, options);
}

export function $getByLabel(
    selector: string,
    options?: {
        exact?: boolean;
    }
): Locator {
    return BrowserInstance.currentPage.getByLabel(selector, options);
}
