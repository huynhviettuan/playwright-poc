import { JSONObject } from '@models/requests/json-object.type';
import { ReadStream } from 'node:fs';
import { URLSearchParams } from 'node:url';

export type RequestArgs = {
    url?: string;
    uri?: string;
    token?: string;
    id?: string;
    timeout?: number;
    body?: JSONObject;
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
    headers:
        | {
              Authorization: string;
              'Api-Key'?: string;
              'x-api-token'?: string;
              'tenant-Url'?: string;
              'tenant-id'?: string;
          }
        | { Authorization?: undefined };
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
