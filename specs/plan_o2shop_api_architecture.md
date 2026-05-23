# O2Shop Backend — API Architecture Plan

## Decision Log

| # | Question | Decision |
|---|---|---|
| 1 | Route structure | Dedicated `/admin/*` prefix, public routes unchanged |
| 2 | Current-user surface | Scoped `/me`, `/me/orders`, `/me/addresses` |
| 3 | Admin controller location | Inside each feature module alongside public controller |
| 4 | Pagination | Offset-based, shared `PaginationQueryDto` + `PaginatedResponseDto<T>` |
| 5 | Response DTO strategy | Separate DTOs with inheritance (`AdminXxxDto extends XxxDto`) |
| 6 | Filter extensibility | Dedicated filter DTOs, class-extensible, `whitelist: true` drops unknown keys |
| 7 | Reviews on product page | Separate `GET /products/:productId/reviews`, rating scalar stays on product |
| 8 | Admin user management | Full CRUD (no hard delete, no create) |
| 9 | MeController home | Dedicated `MeModule` importing feature modules |
| 10 | DTO mapping | Controller maps entity → DTO via `plainToInstance` |

---

## Module Structure

```
src/
  common/
    dto/
      pagination-query.dto.ts          ← { page, limit }
      paginated-response.dto.ts        ← { data: T[], total, page, limit }
    embeds/
      address.embed.ts                 ← (existing)
    storage/                           ← (existing)

  me/
    me.module.ts                       ← imports UsersModule, OrdersModule, AddressesModule
    me.controller.ts                   ← GET /me  /me/orders  /me/addresses

  users/
    users.module.ts                    ← exports UsersService
    users.service.ts
    admin-users.controller.ts          ← /admin/users/*
    dto/
      user-response.dto.ts
      admin-user-response.dto.ts       ← extends UserResponseDto
      filter-users-query.dto.ts        ← search, role, isDeleted, userId, createdAfter, createdBefore, ...
      update-admin-user.dto.ts         ← role?, tokenVersion reset?, deletedAt?

  products/
    products.module.ts                 ← exports ProductsService
    products.service.ts
    products.controller.ts             ← public routes
    admin-products.controller.ts       ← /admin/products/*
    dto/
      product-response.dto.ts
      admin-product-response.dto.ts    ← extends ProductResponseDto
      filter-products-query.dto.ts     ← collectionSlug?, categorySlug?, subCategorySlug?,
                                          search?, minPrice?, maxPrice?,
                                          sortBy?, sortOrder?, page, limit, ...
      admin-filter-products-query.dto.ts ← extends FilterProductsQueryDto
                                          + isPublished?, includeDeleted?, ...

  reviews/
    reviews.module.ts                  ← exports ReviewsService
    reviews.service.ts
    reviews.controller.ts              ← public + auth-user routes
    admin-reviews.controller.ts        ← /admin/reviews/*
    dto/
      review-response.dto.ts
      admin-review-response.dto.ts     ← extends ReviewResponseDto
      filter-reviews-query.dto.ts      ← productId?, status?, userId?, ...

  collections/
    collections.module.ts              ← exports CollectionsService
    collections.service.ts
    collections.controller.ts          ← GET /collections  /collections/:id
    admin-collections.controller.ts    ← /admin/collections/*
    dto/
      collection-response.dto.ts
      admin-collection-response.dto.ts

  categories/
    categories.module.ts               ← exports CategoriesService
    categories.service.ts
    categories.controller.ts           ← GET routes
    admin-categories.controller.ts     ← /admin/categories/*
    dto/
      category-response.dto.ts

  orders/
    orders.module.ts                   ← exports OrdersService
    orders.service.ts
    orders.controller.ts               ← POST /orders  GET /orders/:orderNumber
    admin-orders.controller.ts         ← /admin/orders/*
    dto/
      order-response.dto.ts
      admin-order-response.dto.ts      ← extends OrderResponseDto
      filter-orders-query.dto.ts       ← userId?, guestEmail?, paymentStatus?,
                                          fulfillmentStatus?, createdAfter?, createdBefore?, ...

  addresses/
    addresses.module.ts                ← exports AddressesService
    addresses.service.ts
    addresses.controller.ts            ← all auth-user routes

  shipping/
    shipping.module.ts
    shipping.service.ts
    shipping.controller.ts             ← GET /shipping-methods
    admin-shipping.controller.ts       ← /admin/shipping-methods/*
```

---

## Full Route Map

### Public — `AuthType.None`

| Method | Route | Notes |
|---|---|---|
| `GET` | `/products` | `FilterProductsQueryDto`; hides `isPublished=false` |
| `GET` | `/products/:name` | Detail + rating scalar; 404 if unpublished and caller is not admin |
| `GET` | `/products/:productId/reviews` | `APPROVED` only, paginated |
| `GET` | `/collections` | Active only |
| `GET` | `/collections/:id` | |
| `GET` | `/categories` | |
| `GET` | `/categories/:id` | |
| `GET` | `/categories/:id/subcategories` | |
| `GET` | `/shipping-methods` | `isActive=true` only |
| `POST` | `/orders` | Guest or authenticated; validates stock |
| `GET` | `/orders/:orderNumber` | Guest order lookup by order number |
| `POST` | `/products/:productId/reviews` | Guest or authenticated |

### Authenticated User — `AuthType.Bearer`

| Method | Route | Notes |
|---|---|---|
| `GET` | `/me` | Profile: id, email, role, googleLinked, createdAt |
| `GET` | `/me/orders` | Paginated own orders → `OrderResponseDto` |
| `GET` | `/me/addresses` | Own saved addresses |
| `POST` | `/addresses` | |
| `PATCH` | `/addresses/:id` | Scoped to current user |
| `DELETE` | `/addresses/:id` | Scoped to current user |
| `DELETE` | `/reviews/:id` | Own review only; service enforces ownership |

### Admin — `AuthType.Bearer` + `@Roles(Role.ADMIN)` at controller class level

| Method | Route | Notes |
|---|---|---|
| `GET` | `/admin/users` | `FilterUsersQueryDto` |
| `GET` | `/admin/users/:id` | |
| `PATCH` | `/admin/users/:id` | role, soft-ban, `tokenVersion++` (force logout) |
| `DELETE` | `/admin/users/:id` | Soft delete |
| `GET` | `/admin/products` | `AdminFilterProductsQueryDto` |
| `GET` | `/admin/products/:id` | Includes `isPublished`, `deletedAt`, timestamps |
| `POST` | `/admin/products` | |
| `PATCH` | `/admin/products/:id` | |
| `DELETE` | `/admin/products/:id` | Soft delete |
| `POST` | `/admin/products/:id/variants` | |
| `PATCH` | `/admin/products/:id/variants/:variantId` | |
| `DELETE` | `/admin/products/:id/variants/:variantId` | |
| `POST` | `/admin/products/:id/variants/:variantId/default` | Sets `defaultVariantId` |
| `POST` | `/admin/products/:id/photos` | Multipart, calls `StorageService` |
| `DELETE` | `/admin/products/:id/photos/:photoId` | |
| `GET` | `/admin/products/:productId/reviews` | All statuses, `FilterReviewsQueryDto` |
| `GET` | `/admin/reviews` | Cross-product review list |
| `PATCH` | `/admin/reviews/:id/status` | `{ status: ReviewStatus }` |
| `DELETE` | `/admin/reviews/:id` | Admin override |
| `GET` | `/admin/collections` | |
| `POST` | `/admin/collections` | |
| `PATCH` | `/admin/collections/:id` | |
| `DELETE` | `/admin/collections/:id` | |
| `GET` | `/admin/categories` | |
| `POST` | `/admin/categories` | |
| `PATCH` | `/admin/categories/:id` | |
| `DELETE` | `/admin/categories/:id` | |
| `POST` | `/admin/categories/:id/subcategories` | |
| `PATCH` | `/admin/categories/:id/subcategories/:subId` | |
| `DELETE` | `/admin/categories/:id/subcategories/:subId` | |
| `GET` | `/admin/shipping-methods` | All (including `isActive=false`) |
| `POST` | `/admin/shipping-methods` | |
| `PATCH` | `/admin/shipping-methods/:id` | |
| `DELETE` | `/admin/shipping-methods/:id` | |
| `GET` | `/admin/orders` | `FilterOrdersQueryDto` |
| `GET` | `/admin/orders/:id` | Full detail inc. guest info, payment ref |
| `PATCH` | `/admin/orders/:id/status` | `{ paymentStatus?, fulfillmentStatus? }` |

---

## Response DTO Inheritance Pattern

```typescript
// Public shape — returned by public and auth-user routes
class ProductResponseDto {
  id: string;
  name: string;
  displayName: string;
  basePrice: number;
  currency: string;
  description: ProductDescription;
  rating: number;                    // AVG of APPROVED reviews, computed in service
  photos: ProductPhotoDto[];
  defaultVariant: ProductVariantDto;
  variants: ProductVariantDto[];
  collection?: CollectionSummaryDto;
  category: CategorySummaryDto;
  subCategory: SubCategorySummaryDto;
}

// Admin shape — extends public, adds operational fields
class AdminProductResponseDto extends ProductResponseDto {
  isPublished: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Same pattern for every resource:
- `UserResponseDto` → `AdminUserResponseDto`
- `OrderResponseDto` → `AdminOrderResponseDto`
- `ReviewResponseDto` → `AdminReviewResponseDto`
- `CollectionResponseDto` → `AdminCollectionResponseDto`

---

## Shared Pagination

```typescript
// src/common/dto/pagination-query.dto.ts
export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 20;
}

// src/common/dto/paginated-response.dto.ts
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

All filter DTOs extend `PaginationQueryDto`. New filters are added as optional fields — `whitelist: true` on the global `ValidationPipe` silently drops any params not declared in the DTO.

---

## Filter DTO Extensibility Pattern

```typescript
// Base public filters — extend to add more
export class FilterProductsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() collectionSlug?: string;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsString() subCategorySlug?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @IsOptional() @IsIn(['createdAt', 'price', 'name']) sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: string;
  // add new public filters here
}

// Admin filters extend public — adds admin-only options
export class AdminFilterProductsQueryDto extends FilterProductsQueryDto {
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true') isPublished?: boolean;
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true') includeDeleted?: boolean;
  // add new admin-only filters here
}
```

---

## Controller Pattern (canonical example)

```typescript
// products.controller.ts — public
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Auth(AuthType.None)
  async findAll(
    @Query() query: FilterProductsQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const result = await this.productsService.findAll(query, false);
    return {
      data: result.data.map(p => plainToInstance(ProductResponseDto, p)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }
}

// admin-products.controller.ts — admin
@Controller('admin/products')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query() query: AdminFilterProductsQueryDto,
  ): Promise<PaginatedResponseDto<AdminProductResponseDto>> {
    const result = await this.productsService.findAll(query, true);
    return {
      data: result.data.map(p => plainToInstance(AdminProductResponseDto, p)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }
}
```

Service receives `isAdmin: boolean` (or the full query DTO) to branch query logic — include unpublished, include soft-deleted — without any DTO knowledge.

---

## MeModule Wiring

```typescript
// src/me/me.module.ts
@Module({
  imports: [UsersModule, OrdersModule, AddressesModule],
  controllers: [MeController],
})
export class MeModule {}

// src/me/me.controller.ts
@Controller('me')
@Auth(AuthType.Bearer)
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly addressesService: AddressesService,
  ) {}

  @Get()
  async getProfile(@CurrentUser() user: CurrentUserData): Promise<UserResponseDto> {
    const entity = await this.usersService.findById(user.sub);
    return plainToInstance(UserResponseDto, entity);
  }

  @Get('orders')
  async getOrders(
    @CurrentUser() user: CurrentUserData,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const result = await this.ordersService.findByUserId(user.sub, query);
    return {
      data: result.data.map(o => plainToInstance(OrderResponseDto, o)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Get('addresses')
  async getAddresses(@CurrentUser() user: CurrentUserData): Promise<SavedAddressDto[]> {
    const list = await this.addressesService.findByUserId(user.sub);
    return list.map(a => plainToInstance(SavedAddressDto, a));
  }
}
```

---

## AppModule Registration

```typescript
imports: [
  ConfigModule,
  DatabaseModule,
  StorageModule,   // @Global() — no need to import in feature modules
  AuthModule,
  UsersModule,
  CollectionsModule,
  CategoriesModule,
  ProductsModule,
  ReviewsModule,
  ShippingModule,
  AddressesModule,
  OrdersModule,
  MeModule,        // composed last — depends on all feature modules
]
```
