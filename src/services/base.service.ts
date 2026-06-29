import { URLSearchParams } from 'node:url';

import { BrowserInstance } from '@common/browser';
import { LONG_TIMEOUT } from '@constants/common.constant';
import { API_DOMAIN } from '@constants/config.constant';
import { StringHelper } from '@helpers/functions/helper-functions';
import { type RequestArgs, type RequestOptions, type ServiceResponse } from '@models/requests/request.type';
import { type APIRequestContext, type APIResponse } from '@playwright/test';

const DEBUG = process.env.DEBUG_API === 'true';

export class BaseService {
    protected readonly basePath: string;
    private _token?: string;
    private _headers: Record<string, string> = {};
    private readonly _parent?: BaseService;

    constructor(basePath: string = '', parent?: BaseService) {
        this.basePath = parent ? `${parent.basePath}${basePath}` : basePath;
        this._parent = parent;
    }

    get token(): string | undefined {
        return this._parent ? this._parent.token : this._token;
    }

    setToken(token: string): this {
        if (this._parent) {
            this._parent.setToken(token);
        } else {
            this._token = token;
        }
        return this;
    }

    setHeaders(headers: Record<string, string>): this {
        if (this._parent) {
            this._parent.setHeaders(headers);
        } else {
            this._headers = { ...this._headers, ...headers };
        }
        return this;
    }

    protected getDefaultHeaders(): Record<string, string> {
        return {};
    }

    protected get headers(): Record<string, string> {
        return this._parent ? { ...this._parent.headers, ...this._headers } : this._headers;
    }

    protected endpoint(subPath: string = ''): string {
        return `${API_DOMAIN}${this.basePath}${subPath}`;
    }

    private createUrl({ url, uri, id }: RequestArgs): string {
        const baseUrl = url ?? this.endpoint(uri ?? '');
        return id ? `${baseUrl}/${id}` : baseUrl;
    }

    private buildHeaders(args: RequestArgs): Record<string, string> {
        const authToken = args.token ?? this.token;
        return {
            ...this.getDefaultHeaders(),
            ...this.headers,
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...args.headers
        };
    }

    private buildRequestOptions(args: RequestArgs): RequestOptions {
        const { body, multipart, timeout = LONG_TIMEOUT, params } = args;

        const normalizedParams: string | URLSearchParams | Record<string, string | number | boolean> =
            typeof params === 'object' && !(params instanceof URLSearchParams)
                ? StringHelper.normalizeParams(params)
                : params;

        return {
            headers: this.buildHeaders(args),
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
