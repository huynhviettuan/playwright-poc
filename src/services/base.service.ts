import { BrowserInstance } from '@common/browser';
import { LONG_TIMEOUT } from '@constants/common.constant';
import { API_DOMAIN } from '@constants/config.constant';
import { JSONObject } from '@models/requests/json-object.type';
import { ReadStream } from 'fs';
import { APIResponse } from 'playwright-core';

export class BaseService {
    endpoint: string;
    constructor(path?: string) {
        this.endpoint = API_DOMAIN;
        if (path) this.endpoint = API_DOMAIN.concat(path);
    }

    async get(request: {
        url?: string;
        token?: string;
        id?: string;
        timeout?: number;
        body?: JSONObject;
    }): Promise<{ statusCode: number; response: APIResponse }> {
        const { url, token, id, timeout = LONG_TIMEOUT, body } = request;
        const response: APIResponse = await (
            await BrowserInstance.getRequest()
        ).get(`${url || this.endpoint}${id ? `/${id}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            failOnStatusCode: false,
            data: body,
            timeout
        });
        return {
            statusCode: response.status(),
            response
        };
    }

    async delete(request: {
        url?: string;
        token?: string;
        id?: string;
        body?: JSONObject;
    }): Promise<{ statusCode: number }> {
        const { url, token, id, body } = request;
        const response: APIResponse = await (
            await BrowserInstance.getRequest()
        ).delete(`${url || this.endpoint}${id ? `/${id}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            failOnStatusCode: false,
            data: body,
            timeout: LONG_TIMEOUT
        });
        return {
            statusCode: response.status()
        };
    }

    async post(request: {
        body?: JSONObject;
        url?: string;
        token?: string;
        id?: string;
        multipart?:
            | FormData
            | {
                  [key: string]:
                      | string
                      | number
                      | boolean
                      | ReadStream
                      | {
                            name: string;
                            mimeType: string;
                            buffer: Buffer;
                        };
              };
    }): Promise<{ statusCode: number; response: APIResponse }> {
        const { body, url, token, id, multipart } = request;
        const response: APIResponse = await (
            await BrowserInstance.getRequest()
        ).post(`${url || this.endpoint}${id ? `/${id}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            failOnStatusCode: false,
            data: body,
            multipart: multipart,
            timeout: LONG_TIMEOUT
        });
        return {
            statusCode: response.status(),
            response
        };
    }

    async put(request: {
        body?: JSONObject;
        url?: string;
        token?: string;
        id?: string;
        multipart?:
            | FormData
            | {
                  [key: string]:
                      | string
                      | number
                      | boolean
                      | ReadStream
                      | {
                            name: string;
                            mimeType: string;
                            buffer: Buffer;
                        };
              };
    }): Promise<{ statusCode: number; response: APIResponse }> {
        const { body, url, token, id, multipart } = request;
        const response: APIResponse = await (
            await BrowserInstance.getRequest()
        ).put(`${url || this.endpoint}${id ? `/${id}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            failOnStatusCode: false,
            data: body,
            multipart: multipart,
            timeout: LONG_TIMEOUT
        });
        return {
            statusCode: response.status(),
            response
        };
    }

    async patch(request: {
        body?: JSONObject;
        url?: string;
        token?: string;
        id?: string;
        multipart?:
            | FormData
            | {
                  [key: string]:
                      | string
                      | number
                      | boolean
                      | ReadStream
                      | {
                            name: string;
                            mimeType: string;
                            buffer: Buffer;
                        };
              };
    }): Promise<{ statusCode: number; response: APIResponse }> {
        const { body, url, token, id, multipart } = request;
        const response = await (
            await BrowserInstance.getRequest()
        ).patch(`${url || this.endpoint}${id ? `/${id}` : ''}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            failOnStatusCode: false,
            data: body,
            multipart: multipart,
            timeout: LONG_TIMEOUT
        });
        return {
            statusCode: response.status(),
            response
        };
    }

    createEndpoint(subResource: string): string {
        return `${this.endpoint}${subResource}`;
    }
}
