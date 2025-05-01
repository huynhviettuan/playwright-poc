import { FILES_PATH } from '@constants/common.constant';
import { JSONObject, JSONValue } from '@models/requests/json-object.type';
import { readFileSync } from 'fs';
import * as fs from 'fs/promises';
import { decode } from 'html-entities';
import { APIResponse, Response } from 'playwright-core';
import { BrowserInstance } from 'src/common/browser';

export function generateQueryParamsPath(paramsObject: JSONObject, startWith = '?'): string {
    return paramsObject
        ? startWith +
              Object.keys(paramsObject)
                  .map((key) => {
                      const value: JSONValue = paramsObject[key];
                      return `${key}=${Array.isArray(value) ? value.join(',') : encodeURIComponent(value.toString())}`;
                  })
                  .join('&')
        : '';
}

export function decodeHTML(html: string): string {
    return decode(html);
}

export async function syncForEach<T, R>(
    iterable: T[],
    callback: (item: T, index: number, iterable: T[]) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let index = 0; index < iterable.length; index++) {
        const result = await callback(iterable[index], index, iterable);
        results.push(result);
    }
    return results;
}

export async function asyncForEach<T, R>(
    iterable: T[],
    callback: (item: T, index: number, iterable: T[]) => Promise<R>
): Promise<R[]> {
    const promises = iterable.map((item, index, array) => callback(item, index, array));
    return Promise.all(promises);
}

export async function resolveAll<T extends readonly unknown[]>(
    promises: [...T]
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    return Promise.all(promises);
}

export async function fetchJsonResponse<T>(fetchPromiseResponse: { response: APIResponse }): Promise<T> {
    const { response } = fetchPromiseResponse;
    return (await response.json()) as T;
}

export async function fetchInterceptedJsonResponse<T>(response: Response): Promise<T> {
    return (await response.json()) as T;
}

export async function waitForResponse(url: string, timeout?: number): Promise<Response> {
    const regex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return await BrowserInstance.currentPage.waitForResponse((response) => regex.test(response.url()), {
        timeout
    });
}

export async function writeJsonFile(location: string, data: string): Promise<void> {
    try {
        await fs.writeFile(location, data);
    } catch (err) {
        console.error(err);
    }
}

export function generateFileBlob(fileName: string, filePath = FILES_PATH): Blob {
    return new Blob([readFileSync(`${filePath}${fileName}`)], {
        type: 'text/plain'
    });
}
