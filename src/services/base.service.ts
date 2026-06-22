import { URLSearchParams } from 'node:url';

import { BrowserInstance } from '@common/browser';
import { LONG_TIMEOUT } from '@constants/common.constant';
import { API_DOMAIN } from '@constants/config.constant';
import { StringHelper } from '@helpers/helper-functions';
import { type RequestArgs, type RequestOptions, type ServiceResponse } from '@models/requests/request.type';
import { type APIRequestContext, type APIResponse } from '@playwright/test';

const DEBUG = process.env.DEBUG_API === 'true';

export class BaseService {
    protected readonly basePath: string;
    private _token?: string;

    constructor(basePath: string = '') {
        this.basePath = basePath;
    }

    get token(): string | undefined {
        return this._token;
    }

    setToken(token: string): this {
        this._token = token;
        return this;
    }

    protected endpoint(subPath: string = ''): string {
        return `${API_DOMAIN}${this.basePath}${subPath}`;
    }

    private createUrl({ url, uri, id }: RequestArgs): string {
        const baseUrl = url ?? this.endpoint(uri ?? '');
        return id ? `${baseUrl}/${id}` : baseUrl;
    }

    private buildHeaders(token?: string): Record<string, string> {
        const authToken = token ?? this._token;
        return {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        };
    }

    private buildRequestOptions({
        token,
        body,
        multipart,
        timeout = LONG_TIMEOUT,
        params
    }: RequestArgs): RequestOptions {
        const normalizedParams: string | URLSearchParams | Record<string, string | number | boolean> =
            typeof params === 'object' && !(params instanceof URLSearchParams)
                ? StringHelper.normalizeParams(params)
                : params;

        return {
            headers: this.buildHeaders(token),
            failOnStatusCode: false,
            data: body,
            multipart,
            timeout,
            params: normalizedParams
        };
    }

    private logRequest(method: string, url: string, options: RequestOptions): void {
        if (!DEBUG) return;
        console.log(`[API] → ${method.toUpperCase()} ${url}`);
        if (options.headers && Object.keys(options.headers).length > 0) {
            const safeHeaders = { ...options.headers };
            if (safeHeaders['Authorization']) {
                safeHeaders['Authorization'] = 'Bearer ***';
            }
            console.log(`[API]   Headers: ${JSON.stringify(safeHeaders)}`);
        }
        if (options.data) {
            console.log(`[API]   Body: ${JSON.stringify(options.data)}`);
        }
        if (options.params) {
            console.log(`[API]   Params: ${JSON.stringify(options.params)}`);
        }
    }

    private logResponse(method: string, url: string, statusCode: number, durationMs: number): void {
        if (!DEBUG) return;
        console.log(`[API] ← ${method.toUpperCase()} ${url} — ${statusCode} (${durationMs}ms)`);
    }

    private async sendRequest(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        url: string,
        options: RequestOptions
    ): Promise<{ statusCode: number; response: APIResponse }> {
        this.logRequest(method, url, options);
        const start = Date.now();

        const request: APIRequestContext = await BrowserInstance.getRequest();
        const response: APIResponse = await request[method](url, options);
        const statusCode = response.status();

        this.logResponse(method, url, statusCode, Date.now() - start);

        return { statusCode, response };
    }

    protected async send<T = unknown>(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        args: RequestArgs = {}
    ): Promise<ServiceResponse<T>> {
        const url = this.createUrl(args);
        const options = this.buildRequestOptions(args);
        const { statusCode, response } = await this.sendRequest(method, url, options);
        const text = await response.text();
        const data = text ? (JSON.parse(text) as T) : (undefined as T);
        return { statusCode, data, response };
    }

    async get(request: RequestArgs = {}): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('get', url, options);
    }

    async delete(request: RequestArgs = {}): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('delete', url, options);
    }

    async post(request: RequestArgs = {}): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('post', url, options);
    }

    async put(request: RequestArgs = {}): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('put', url, options);
    }

    async patch(request: RequestArgs = {}): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('patch', url, options);
    }
}
