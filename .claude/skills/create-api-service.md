# Skill: Create API Service

## When to Use
Use this skill when creating a new API service for making HTTP requests.

## Critical Rules

### ✅ Types Live in `@models`, Not Beside the Service

Request and response types belong under `src/models/<module>/<module>.interface.ts`
— **never** co-located with the service class. This matches the existing convention
(`@models/elements/*.interface.ts`, `@models/mail/mail.interface.ts`,
`@models/requests/*`) and lets consumers (commands, factories, fixtures, tests) import
types without pulling in service implementations.

## Instructions

1. **Define request/response types** in `src/models/[module]/[module].interface.ts`:
   ```ts
   // src/models/user-organization/user-organization.interface.ts
   export type SignInRequest = {
       email: string;
       password: string;
   };

   export type SignInResponse = {
       token: string;
       refreshToken?: string;
   };
   ```

2. **Create the service class** in `src/services/[service-name].service.ts`:
   ```ts
   import { SignInRequest } from '@models/[module]/[module].interface';
   import { BaseService } from '@services/base.service';
   
   export class [ServiceName]Service extends BaseService {
       constructor() {
           super('/[resource]');
       }
       
       async get[Resource](token: string, id?: string) {
           return await this.get({ token, id });
       }
       
       async create[Resource](token: string, body: SignInRequest) {
           return await this.post({ token, body });
       }
       
       async update[Resource](token: string, id: string, body: SignInRequest) {
           return await this.put({ token, id, body });
       }
       
       async delete[Resource](token: string, id: string) {
           return await this.delete({ token, id });
       }
   }
   ```

   > Use `JSONObject` from `@models/requests/json-object.type` only when the body
   > shape is genuinely generic (e.g. passthrough endpoints). Otherwise type the
   > body with a concrete `Request` interface.

3. **Register the service in fixtures** at `src/fixtures/service-fixtures.ts`:
   ```ts
   import { [ServiceName]Service } from '@services/[service-name].service';
   
   type Services = {
       [serviceName]Service: [ServiceName]Service;
   };
   
   export const test = base.extend<Services>({
       [serviceName]Service: async ({}, use) => {
           await use(new [ServiceName]Service());
       }
   });
   ```

## BaseService Methods Available

- **get(options)**: GET request with token, id, timeout, body
- **post(options)**: POST request with body, token, id, multipart
- **put(options)**: PUT request with body, token, id, multipart
- **patch(options)**: PATCH request with body, token, id, multipart
- **delete(options)**: DELETE request with token, id, body

## Return Format
```ts
{
    statusCode: number;
    response: APIResponse;
}
```

## Common Patterns

### Multipart Upload
```ts
await this.post({
    token,
    multipart: {
        file: {
            name: 'image.png',
            mimeType: 'image/png',
            buffer: Buffer.from(data)
        }
    }
});
```

### Custom Endpoint
```ts
const endpoint = this.createEndpoint('/sub-resource');
await this.get({ url: endpoint, token });
```
