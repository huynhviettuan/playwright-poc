# Skill: Create Service from Swagger

## When to Use

Use this skill when you have a **Swagger/OpenAPI spec** (JSON or YAML, v2 or v3) and want to generate the full service
layer: interfaces, service class, fixtures registration, and endpoint constants — all following the controller pattern
from [`create-api-service.md`](./create-api-service.md).

Typical triggers:

-   "Here's the Swagger JSON for the Users API — generate the service"
-   "Convert this OpenAPI spec to a service class"
-   "I have swagger.json at this URL — create services from it"

## When NOT to Use

| Situation                           | Use instead                                                    |
| ----------------------------------- | -------------------------------------------------------------- |
| No Swagger spec available           | [`create-api-service.md`](./create-api-service.md) (manual)    |
| Need to explore a live screen first | [`explore-screens.md`](./explore-screens.md) → then this skill |
| Only need request/response types    | Extract Step 2 only                                            |

## Input Formats

This skill accepts Swagger in any of these forms:

| Format               | How to provide                                        |
| -------------------- | ----------------------------------------------------- |
| **File path**        | `src/data/swagger/users.json` or `.yaml`              |
| **URL**              | `https://api.example.com/swagger.json` or `/api-docs` |
| **Pasted JSON/YAML** | Inline in the conversation                            |
| **Partial spec**     | Just the `paths` + `components/schemas` sections      |

## Workflow Overview

```
1. Parse the Swagger spec
2. Extract types        → src/models/<module>/<module>.interface.ts
3. Generate service     → src/services/<module>.service.ts
4. Update endpoints     → src/constants/endpoints.constant.ts
5. Update registry      → docs/registry/services.md
6. Register fixture     → src/fixtures/service-fixtures.ts
7. Verify               → tsc --noEmit + eslint
```

## Step 1: Parse the Swagger Spec

Read the spec and identify:

-   **`info.title`** or **tags** → service class name
-   **`servers[0].url`** or **`basePath`** → `super('/base-path')` in constructor
-   **`paths`** → one method per operation
-   **`components.schemas`** (v3) or **`definitions`** (v2) → TypeScript interfaces

### Mapping Rules

| Swagger concept                  | Framework artifact                   |
| -------------------------------- | ------------------------------------ |
| Tag name (e.g. `"Users"`)        | Service class: `UsersService`        |
| `servers[0].url + common prefix` | `super('/users')` basePath           |
| `operationId`                    | Method name (converted to camelCase) |
| Path parameters `{id}`           | Method argument: `id: string`        |
| Query parameters                 | Optional params object               |
| Request body schema              | `Request` type in `@models/`         |
| Response `200/201` schema        | `Response` type in `@models/`        |
| `$ref` to shared schema          | Shared type, same file or separate   |

## Step 2: Extract Types

For each **request body** and **success response** schema, generate a TypeScript type.

### Schema-to-TypeScript rules

| OpenAPI type                     | TypeScript type                                |
| -------------------------------- | ---------------------------------------------- |
| `string`                         | `string`                                       |
| `string` + `format: date-time`   | `string` (ISO 8601)                            |
| `string` + `enum: [...]`         | String literal union: `'active' \| 'inactive'` |
| `integer` / `number`             | `number`                                       |
| `boolean`                        | `boolean`                                      |
| `array` + `items: { $ref }`      | `Type[]`                                       |
| `object` + `properties`          | Named interface                                |
| `$ref: '#/components/schemas/X'` | Import/reuse `X` type                          |
| Required field                   | Non-optional property                          |
| Optional field                   | Property with `?`                              |

### Naming conventions

| Swagger schema                     | TypeScript name            | File                                  |
| ---------------------------------- | -------------------------- | ------------------------------------- |
| Request body for `POST /users`     | `CreateUserRequest`        | `src/models/users/users.interface.ts` |
| Request body for `PUT /users/{id}` | `UpdateUserRequest`        | same file                             |
| Response for `GET /users`          | `User` (entity)            | same file                             |
| Response for `GET /users` (list)   | `User[]` (array of entity) | same file                             |
| Shared pagination wrapper          | `PaginatedResponse<T>`     | `src/models/requests/request.type.ts` |

### Example conversion

**Swagger schemas:**

```yaml
components:
    schemas:
        CreateUserRequest:
            type: object
            required: [name, email]
            properties:
                name:
                    type: string
                email:
                    type: string
                    format: email
                role:
                    type: string
                    enum: [admin, user, viewer]
        User:
            type: object
            properties:
                id:
                    type: string
                    format: uuid
                name:
                    type: string
                email:
                    type: string
                role:
                    type: string
                    enum: [admin, user, viewer]
                createdAt:
                    type: string
                    format: date-time
```

**Generated TypeScript** (`src/models/users/users.interface.ts`):

```ts
export type UserRole = 'admin' | 'user' | 'viewer';

export type CreateUserRequest = {
    name: string;
    email: string;
    role?: UserRole;
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
};
```

## Step 3: Generate Service

Map each **path + method** to a service method.

### Path-to-method mapping

| Swagger path                 | HTTP   | Method name  | Signature                                        |
| ---------------------------- | ------ | ------------ | ------------------------------------------------ |
| `GET /resource`              | GET    | `getAll`     | `(params?) → ServiceResponse<T[]>`               |
| `GET /resource/{id}`         | GET    | `getById`    | `(id: string) → ServiceResponse<T>`              |
| `POST /resource`             | POST   | `create`     | `(body: CreateRequest) → ServiceResponse<T>`     |
| `PUT /resource/{id}`         | PUT    | `update`     | `(id, body: UpdateRequest) → ServiceResponse<T>` |
| `PATCH /resource/{id}`       | PATCH  | `patch`      | `(id, body: PatchRequest) → ServiceResponse<T>`  |
| `DELETE /resource/{id}`      | DELETE | `deleteById` | `(id: string) → ServiceResponse<void>`           |
| `POST /resource/{id}/action` | POST   | `actionName` | `(id, body?) → ServiceResponse<T>`               |
| `GET /resource/{id}/sub`     | GET    | `getSub`     | `(id: string) → ServiceResponse<Sub[]>`          |

### Non-CRUD endpoints

When `operationId` doesn't fit CRUD (e.g. `POST /auth/signin`), use the operationId directly:

```ts
// operationId: signIn
async signIn(body: SignInRequest): Promise<ServiceResponse<SignInResponse>> {
    return await this.send<SignInResponse>('post', {
        url: this.endpoint('/signin'),
        body
    });
}
```

### Full example

**Swagger paths:**

```yaml
paths:
    /users:
        get:
            tags: [Users]
            operationId: getUsers
            parameters:
                - name: page
                  in: query
                  schema: { type: integer }
                - name: perPage
                  in: query
                  schema: { type: integer }
            responses:
                200:
                    content:
                        application/json:
                            schema:
                                type: array
                                items: { $ref: '#/components/schemas/User' }
        post:
            tags: [Users]
            operationId: createUser
            requestBody:
                content:
                    application/json:
                        schema: { $ref: '#/components/schemas/CreateUserRequest' }
            responses:
                201:
                    content:
                        application/json:
                            schema: { $ref: '#/components/schemas/User' }
    /users/{id}:
        get:
            tags: [Users]
            operationId: getUserById
            parameters:
                - name: id
                  in: path
                  required: true
                  schema: { type: string }
            responses:
                200:
                    content:
                        application/json:
                            schema: { $ref: '#/components/schemas/User' }
        delete:
            tags: [Users]
            operationId: deleteUser
            parameters:
                - name: id
                  in: path
                  required: true
                  schema: { type: string }
            responses:
                204: {}
```

**Generated service** (`src/services/users.service.ts`):

```ts
import { type ServiceResponse } from '@models/requests/request.type';
import { type CreateUserRequest, type User } from '@models/users/users.interface';
import { BaseService } from '@services/base.service';

export class UsersService extends BaseService {
    constructor() {
        super('/users');
    }

    async getAll(params?: { page?: number; perPage?: number }): Promise<ServiceResponse<User[]>> {
        return await this.send<User[]>('get', { params });
    }

    async getById(id: string): Promise<ServiceResponse<User>> {
        return await this.send<User>('get', { id });
    }

    async create(body: CreateUserRequest): Promise<ServiceResponse<User>> {
        return await this.send<User>('post', { body });
    }

    async deleteById(id: string): Promise<ServiceResponse<void>> {
        return await this.send<void>('delete', { id });
    }
}
```

## Step 4: Update Endpoints Constant

Add the new API endpoints to `src/constants/endpoints.constant.ts` under `ApiEndpoints`:

```ts
export const ApiEndpoints = {
    // ... existing
    users: {
        list: '/users',
        byId: '/users/{id}'
    }
} as const;
```

## Step 5: Update Service Registry

Add or update the entry in [`docs/registry/services.md`](../../docs/registry/services.md) with the service class, base
path, methods, and models path.

## Step 6: Register Fixture

Add to `src/fixtures/service-fixtures.ts`:

```ts
import { UsersService } from '@services/users.service';

type ServiceObjects = {
    // ... existing
    usersService: UsersService;
};

export const test = base.extend<ServiceObjects>({
    // ... existing
    usersService: async ({}, use) => {
        await use(new UsersService());
    }
});
```

## Step 7: Verify

-   [ ] `npx tsc --noEmit` — zero errors
-   [ ] `npx eslint .` — zero errors
-   [ ] All types match the Swagger schema (required vs optional, enums, nested objects)
-   [ ] Method names are consistent with CRUD conventions
-   [ ] Service extends `BaseService`
-   [ ] Types are in `@models/<module>/`, not beside the service

## Edge Cases

### Multiple tags per path

If a Swagger path has operations under different tags, group by the **primary tag** (first one listed). If two tags map
to different controllers, create two services.

### Shared schemas across services

Put shared types in a common file:

```
src/models/common/pagination.interface.ts   → PaginatedResponse<T>
src/models/common/error.interface.ts        → ErrorResponse
```

### Nested resources

`/users/{userId}/orders` → method on `UsersService` or separate `OrdersService` depending on whether orders exist as a
standalone resource:

```ts
// If orders are always scoped to a user → method on UsersService
async getOrders(userId: string): Promise<ServiceResponse<Order[]>> {
    return await this.send<Order[]>('get', {
        url: this.endpoint(`/${userId}/orders`)
    });
}

// If orders also exist at /orders → separate OrdersService
export class OrdersService extends BaseService {
    constructor() {
        super('/orders');
    }

    async getByUser(userId: string): Promise<ServiceResponse<Order[]>> {
        return await this.send<Order[]>('get', { params: { userId } });
    }
}
```

### File upload endpoints

```yaml
/users/{id}/avatar:
    post:
        requestBody:
            content:
                multipart/form-data:
                    schema:
                        type: object
                        properties:
                            file:
                                type: string
                                format: binary
```

```ts
async uploadAvatar(id: string, file: Buffer, fileName: string): Promise<ServiceResponse<User>> {
    return await this.send<User>('post', {
        url: this.endpoint(`/${id}/avatar`),
        multipart: {
            file: {
                name: fileName,
                mimeType: 'image/png',
                buffer: file
            }
        }
    });
}
```

### Swagger v2 differences

| v2                             | v3 equivalent                                 |
| ------------------------------ | --------------------------------------------- |
| `basePath: /api/v1`            | `servers[0].url`                              |
| `definitions.User`             | `components.schemas.User`                     |
| `parameters` (body type)       | `requestBody.content.application/json.schema` |
| `produces: [application/json]` | Implicit in `responses.200.content`           |

## Related

-   [`create-api-service.md`](./create-api-service.md) — manual service creation + controller pattern details
-   [`write-api-test.md`](./write-api-test.md) — writing tests against generated services
-   [`explore-screens.md`](./explore-screens.md) — capturing API calls from a live app (when no Swagger exists)
