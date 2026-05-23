# Plan: OpenAPI 3.0 / Swagger Documentation for nest-o2shop

## Context

The nest-o2shop NestJS backend is fully implemented (78 routes, 37 DTOs, 15 controllers) but has zero API documentation. This plan adds interactive Swagger UI at `/api/docs`, exports a machine-readable OpenAPI JSON spec to `specs/openapi.json`, generates a Postman collection, and writes TypeScript fetch examples — without changing any business logic.

**Current state:** No `@nestjs/swagger` in `package.json`. `src/main.ts` is 17 lines with no Swagger config.

---

## Deliverables

| Artifact | Location |
|---|---|
| Interactive Swagger UI | `http://localhost:3001/api/docs` |
| OpenAPI JSON spec | `specs/openapi.json` (auto-written on every startup) |
| Postman collection | `specs/postman/o2shop.postman_collection.json` |
| Postman environment | `specs/postman/o2shop.postman_environment.json` |
| TypeScript SDK examples | `specs/examples/typescript/{auth,products,orders}.ts` |

---

## Step 1 — Install Package

```bash
pnpm add @nestjs/swagger swagger-ui-express
```

`swagger-ui-express` is the required peer dep for `@nestjs/platform-express`. No additional dev deps needed.

---

## Step 2 — Fix Three PartialType Imports

`UpdateProductDto`, `UpdateVariantDto`, and `UpdateCollectionDto` import `PartialType` from `@nestjs/mapped-types`. Change to `@nestjs/swagger` so Swagger inherits schema metadata automatically — no per-property changes needed in those update DTOs.

Files to update:
- `src/products/dto/update-product.dto.ts`
- `src/products/dto/update-variant.dto.ts`
- `src/collections/dto/update-collection.dto.ts`

```typescript
// Before
import { PartialType } from '@nestjs/mapped-types';
// After
import { PartialType } from '@nestjs/swagger';
```

---

## Step 3 — Create Error Response DTO

**New file:** `src/common/dto/error-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: ['email must be an email'], type: [String] })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
```

---

## Step 4 — Update main.ts

Full replacement of `src/main.ts`. Adds `DocumentBuilder` config, `SwaggerModule.setup`, and writes `specs/openapi.json` on every startup.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const config = new DocumentBuilder()
    .setTitle('O2Shop API')
    .setDescription(
      'REST API for the O2Shop e-commerce platform. ' +
      'Public endpoints need no authentication. ' +
      'Customer endpoints require a JWT bearer token (from POST /auth/login). ' +
      'Admin endpoints additionally require the `admin` role.',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3001', 'Local development')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
        description: 'Paste the access_token value from POST /auth/login.' },
      'access_token',
    )
    .addTag('Auth', 'Registration, login, Google OAuth')
    .addTag('Products', 'Public product catalogue')
    .addTag('Collections', 'Product collections')
    .addTag('Categories', 'Product categories and subcategories')
    .addTag('Reviews', 'Product reviews — public read, auth write')
    .addTag('Orders', 'Order placement and status lookup')
    .addTag('Shipping Methods', 'Available shipping options')
    .addTag('Me', 'Authenticated user profile, orders, and addresses')
    .addTag('Addresses', 'Saved shipping/billing addresses')
    .addTag('Admin – Products', 'Admin: full product CRUD')
    .addTag('Admin – Orders', 'Admin: order management')
    .addTag('Admin – Reviews', 'Admin: review moderation')
    .addTag('Admin – Collections', 'Admin: collection management')
    .addTag('Admin – Categories', 'Admin: category and subcategory management')
    .addTag('Admin – Shipping', 'Admin: shipping method management')
    .addTag('Admin – Users', 'Admin: user management')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 3,
    },
    customSiteTitle: 'O2Shop API Docs',
  });

  const specsDir = path.join(process.cwd(), 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  fs.writeFileSync(path.join(specsDir, 'openapi.json'), JSON.stringify(document, null, 2));

  await app.listen(3001);
  console.log('API docs: http://localhost:3001/api/docs');
}
void bootstrap();
```

---

## Step 5 — Add @ApiProperty to All DTOs

### Key rules

- `@ApiProperty()` for required fields, `@ApiPropertyOptional()` for optional (`?` type or `@IsOptional()`)
- Enums: `{ enum: EnumClass, enumName: 'EnumName' }` — `enumName` emits a named schema
- Arrays: `{ type: () => ItemClass, isArray: true }`
- Nested DTOs: `{ type: () => NestedClass }`
- `ProductDescription` interface (no runtime type): use raw schema object `{ type: 'object', properties: { blocks: { type: 'array', items: { oneOf: [ ... ] } } } }`

### PaginatedResponseDto — add PaginatedDto factory (critical)

```typescript
// src/common/dto/paginated-response.dto.ts
export class PaginatedResponseDto<T> {
  data: T[];
  @ApiProperty({ example: 100 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
}

export function PaginatedDto<TItem>(TItemClass: new () => TItem) {
  abstract class PaginatedDtoClass extends PaginatedResponseDto<TItem> {
    @ApiProperty({ type: () => TItemClass, isArray: true })
    data: TItem[];
  }
  return PaginatedDtoClass;
}
```

Controllers use: `@ApiOkResponse({ type: PaginatedDto(ProductResponseDto) })`

### DTOs to decorate by module

| Module | Files |
|---|---|
| Common | `pagination-query.dto.ts`, `paginated-response.dto.ts` |
| Auth | `create-local-user.dto.ts` (skip `create-oauth-user.dto.ts` — internal only) |
| Users | `user-response.dto.ts`, `update-admin-user.dto.ts`, `filter-users-query.dto.ts` |
| Products | `create-product.dto.ts`, `filter-products-query.dto.ts`, `admin-filter-products-query.dto.ts`, `product-response.dto.ts`, `product-photo-response.dto.ts`, `product-variant-response.dto.ts`, `create-variant.dto.ts` |
| Orders | `create-order.dto.ts`, `create-order-item.dto.ts`, `order-response.dto.ts`, `order-item-response.dto.ts`, `update-order-status.dto.ts`, `filter-orders-query.dto.ts` |
| Reviews | `create-review.dto.ts`, `update-review-status.dto.ts`, `review-response.dto.ts`, `filter-reviews-query.dto.ts` |
| Collections | `create-collection.dto.ts`, `collection-response.dto.ts` |
| Categories | `create-category.dto.ts`, `create-subcategory.dto.ts`, `category-response.dto.ts` |
| Shipping | `create-shipping-method.dto.ts`, `shipping-method-response.dto.ts` |
| Addresses | `address.dto.ts`, `create-saved-address.dto.ts`, `saved-address-response.dto.ts` |

**Note:** Inline private `AddressResponseDto` exists in both `order-response.dto.ts` and `saved-address-response.dto.ts`. Decorate in-place; Swagger auto-dedupes as `AddressResponseDto` / `AddressResponseDto1`.

### Representative DTO examples

**`src/users/dto/user-response.dto.ts`:**
```typescript
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 'user@example.com' }) @Expose() email: string;
  @ApiPropertyOptional({ example: 'Jane Doe' }) @Expose() displayName?: string;
  @ApiPropertyOptional() @Expose() avatarUrl?: string;
  @ApiProperty({ example: false }) @Expose() googleLinked: boolean;
  @ApiProperty({ enum: Role, enumName: 'Role' }) @Expose() role: Role;
  @ApiProperty({ example: true }) @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
}
export class AdminUserResponseDto extends UserResponseDto {
  @ApiProperty({ example: 1 }) @Expose() tokenVersion: number;
  @ApiPropertyOptional({ nullable: true }) @Expose() deletedAt: Date | null;
  @ApiProperty() @Expose() updatedAt: Date;
  @ApiProperty({ example: 1 }) @Expose() version: number;
}
```

**`src/orders/dto/create-order.dto.ts`:**
```typescript
export class CreateOrderDto {
  @ApiPropertyOptional({ format: 'email', description: 'Required for guest checkout' })
  guestEmail?: string;
  @ApiPropertyOptional() guestFirstName?: string;
  @ApiPropertyOptional() guestLastName?: string;
  @ApiProperty({ format: 'uuid', description: 'ID from GET /shipping-methods' })
  shippingMethodId: string;
  @ApiProperty({ type: () => AddressDto }) shippingAddress: AddressDto;
  @ApiPropertyOptional({ default: false }) billingIsSameAsShipping?: boolean;
  @ApiProperty({ type: () => AddressDto }) billingAddress: AddressDto;
  @ApiProperty({ type: () => CreateOrderItemDto, isArray: true }) items: CreateOrderItemDto[];
}
```

---

## Step 6 — Add Swagger Decorators to All Controllers

### Standard imports for every controller
```typescript
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse,
  ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse,
  ApiParam, ApiBody, ApiConsumes, ApiExcludeController,
} from '@nestjs/swagger';
```

### Controller decoration table

| Controller | Tag | Class-level auth decorators |
|---|---|---|
| `app.controller.ts` | — | `@ApiExcludeController()` |
| `auth.controller.ts` | `Auth` | None |
| `products.controller.ts` | `Products` | None |
| `collections.controller.ts` | `Collections` | None |
| `categories.controller.ts` | `Categories` | None |
| `reviews.controller.ts` | `Reviews` | `@ApiBearerAuth` on DELETE method only |
| `orders.controller.ts` | `Orders` | None |
| `shipping.controller.ts` | `Shipping Methods` | None |
| `me.controller.ts` | `Me` | `@ApiBearerAuth('access_token')` + `@ApiUnauthorizedResponse` |
| `addresses.controller.ts` | `Addresses` | `@ApiBearerAuth('access_token')` + `@ApiUnauthorizedResponse` |
| `admin-products.controller.ts` | `Admin – Products` | `@ApiBearerAuth` + Unauthorized + Forbidden |
| `admin-orders.controller.ts` | `Admin – Orders` | same |
| `admin-reviews.controller.ts` | `Admin – Reviews` | same |
| `admin-collections.controller.ts` | `Admin – Collections` | same |
| `admin-categories.controller.ts` | `Admin – Categories` | same |
| `admin-shipping.controller.ts` | `Admin – Shipping` | same |
| `admin-users.controller.ts` | `Admin – Users` | same |

### Special case: file upload endpoint

`POST /admin/products/:id/photos` is the only multipart endpoint:
```typescript
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: { type: 'string', format: 'binary', description: 'Image file (JPEG, PNG, WebP)' },
    },
  },
})
@ApiCreatedResponse({ type: ProductPhotoResponseDto })
```

### Paginated response pattern
```typescript
// All paginated GET endpoints
@ApiOkResponse({ type: PaginatedDto(ProductResponseDto) })
```

---

## Step 7 — Generate Postman Collection

Add `pnpm postman:generate` script to `package.json` (after openapi.json is written):
```json
"postman:generate": "npx openapi-to-postmanv2 -s specs/openapi.json -o specs/postman/o2shop.postman_collection.json -O folderStrategy=Tags"
```

Create `specs/postman/o2shop.postman_environment.json`:
```json
{
  "name": "O2Shop Local",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:3001", "enabled": true },
    { "key": "accessToken", "value": "", "enabled": true }
  ]
}
```

Post-login test script for `POST /auth/login` in Postman (auto-captures token):
```javascript
const json = pm.response.json();
if (json.access_token) {
  pm.collectionVariables.set('accessToken', json.access_token);
}
```

---

## Step 8 — TypeScript SDK Examples

Three files under `specs/examples/typescript/` using native `fetch` (Node 18+, no extra deps):

| File | Demonstrates |
|---|---|
| `auth.ts` | register → login → `GET /me` with Bearer token |
| `products.ts` | list with query filters (price, sort, search), fetch single product |
| `orders.ts` | get shipping methods → browse products → guest checkout → look up order by number |

Each file has a self-contained `main()` function that can be run with `npx ts-node specs/examples/typescript/<file>.ts`.

---

## Execution Order

1. `pnpm add @nestjs/swagger swagger-ui-express`
2. Fix `PartialType` imports in 3 update DTOs → `@nestjs/swagger`
3. Create `src/common/dto/error-response.dto.ts`
4. Update `src/main.ts`
5. Add `@ApiProperty` to all DTOs (common → auth → users → products → orders → reviews → collections → categories → shipping → addresses)
6. Add `@ApiTags`/`@ApiOperation`/`@ApiResponse` to all controllers
7. `pnpm start:dev` → verify `http://localhost:3001/api/docs` loads with 17 tags and 78 routes; confirm `specs/openapi.json` written
8. Add `postman:generate` script; run it → verify `specs/postman/o2shop.postman_collection.json` created
9. Write three TypeScript example files under `specs/examples/typescript/`

---

## Verification Checklist

- [ ] Swagger UI loads at `http://localhost:3001/api/docs` with all 17 tag groups
- [ ] Authorize dialog accepts a JWT; protected endpoints return 401 without auth
- [ ] `specs/openapi.json` is valid (`npx @redocly/cli lint specs/openapi.json`)
- [ ] Postman: login request auto-sets `{{accessToken}}`; `GET /me` returns 200
- [ ] `npx ts-node specs/examples/typescript/orders.ts` completes without errors

---

## Known Pitfalls

1. **`ProductDescription` interface** — no runtime type; use raw schema object in `@ApiProperty`
2. **`PaginatedResponseDto<T>` generic** — use `PaginatedDto(ItemClass)` factory in `@ApiOkResponse`; the raw generic class produces no useful schema
3. **Cookie auth vs Swagger UI** — app sets `access_token` as httpOnly cookie; testers copy the raw JWT from the login response body into the Swagger "Authorize" dialog
4. **Duplicate `AddressResponseDto` names** — private inline class in two files; Swagger dedupes as `AddressResponseDto1`; acceptable, or extract to a shared file
5. **`@nestjs/mapped-types` collision** — after install, the three update DTOs must import `PartialType` from `@nestjs/swagger` only (not both packages)
