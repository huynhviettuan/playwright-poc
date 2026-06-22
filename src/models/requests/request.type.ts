import { type ReadStream } from 'node:fs';
import { type URLSearchParams } from 'node:url';

import { type JSONObject } from '@models/requests/json-object.type';
import { type APIResponse } from '@playwright/test';

export type RequestArgs = {
    url?: string;
    uri?: string;
    token?: string;
    id?: string;
    timeout?: number;
    body?: JSONObject;
    headers?: Record<string, string>;
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
    params?:
        | string
        | {
              [key: string]: string | number | boolean | string[] | number[] | boolean[];
          }
        | URLSearchParams;
};

export type RequestOptions = {
    headers: Record<string, string>;
    failOnStatusCode: boolean;
    data: JSONObject;
    multipart:
        | FormData
        | {
              [key: string]:
                  | string
                  | number
                  | boolean
                  | ReadStream
                  | { name: string; mimeType: string; buffer: Buffer };
          };
    timeout: number;
    params: string | URLSearchParams | Record<string, string | number | boolean>;
};

export type ServiceResponse<T = unknown> = {
    statusCode: number;
    data: T;
    response: APIResponse;
};
