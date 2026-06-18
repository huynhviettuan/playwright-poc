# Skill: Create API Service

## When to Use
Use this skill when creating a new API service for making HTTP requests.

## Instructions

1. **Create the service class** in `src/services/[service-name].service.ts`:
   ```ts
   import { BaseService } from '@services/base.service';
   import { JSONObject } from '@models/requests/json-object.type';
   
   export class [ServiceName]Service extends BaseService {
       constructor() {
           super('/api/[resource]');
       }
       
       async get[Resource](token: string, id?: string) {
           return await this.get({ token, id });
       }
       
       async create[Resource](token: string, body: JSONObject) {
           return await this.post({ token, body });
       }
       
       async update[Resource](token: string, id: string, body: JSONObject) {
           return await this.put({ token, id, body });
       }
       
       async delete[Resource](token: string, id: string) {
           return await this.delete({ token, id });
       }
   }
   ```

2. **Register the service in fixtures** at `src/fixtures/service-fixtures.ts`:
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
