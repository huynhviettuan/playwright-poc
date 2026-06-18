import { BrowserInstance } from '@common/browser';
import { LONG_TIMEOUT } from '@constants/common.constant';
import { API_DOMAIN } from '@constants/config.constant';
import { StringHelper } from '@helpers/helper-functions';
import { RequestArgs, RequestOptions } from '@models/requests/request.type';
import { URLSearchParams } from 'node:url';
import { APIRequestContext, APIResponse } from 'playwright-core';

export class BaseService {
    endpoint: string;

    constructor(path: string = '') {
        this.endpoint = API_DOMAIN.concat(path);
    }

    createEndpoint(subResource: string): string {
        return `${this.endpoint}${subResource}`;
    }

    private createUrl({ url, uri, id }: RequestArgs): string {
        const baseUrl = url ?? this.createEndpoint(uri ?? '');
        return id ? `${baseUrl}/${id}` : baseUrl;
    }

    private buildHeaders(token?: string): Record<string, string> {
        return {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
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

    private async sendRequest(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        url: string,
        options: RequestOptions
    ): Promise<{ statusCode: number; response: APIResponse }> {
        const request: APIRequestContext = await BrowserInstance.getRequest();
        const response: APIResponse = await request[method](url, options);
        return {
            statusCode: response.status(),
            response
        };
    }

    async get(request: RequestArgs): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('get', url, options);
    }

    async delete(request: RequestArgs): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('delete', url, options);
    }

    async post(request: RequestArgs): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('post', url, options);
    }

    async put(request: RequestArgs): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('put', url, options);
    }

    async patch(request: RequestArgs): Promise<{ statusCode: number; response: APIResponse }> {
        const url = this.createUrl(request);
        const options = this.buildRequestOptions(request);
        return await this.sendRequest('patch', url, options);
    }
}
