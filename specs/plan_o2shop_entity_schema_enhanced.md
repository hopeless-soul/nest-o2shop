# Task: Implement O2Shop Entity Layer — NestJS Clothing Store Backend

## Role & Context

You are implementing the entity and module scaffold for a production-ready NestJS clothing store
backend. The project (`nest-o2shop`) already has:
- Auth system: JWT Bearer + Google OAuth 2.0 + Local strategy, global `AuthenticationGuard`
- `User` entity: UUID PK, soft delete (`@DeleteDateColumn`), `@VersionColumn`, `tokenVersion`
- `HashingModule` pattern: abstract service + concrete impl, re-exported for DI swap
- TypeORM + PostgreSQL with `autoLoadEntities: true` and `synchronize: true` (dev only)
- Global `ConfigModule`, `DatabaseModule`, `AuthModule` registered in `AppModule`
- `@Auth(AuthType.None | Bearer | Local | Google)` decorator controls route protection

**Invoke the `nestjs-best-practices` skill before writing any code.**

---

## Coding Standards (match existing codebase exactly)

- UUIDs for all PKs: `@PrimaryGeneratedColumn('uuid')`
- Timestamps: `@CreateDateColumn()`, `@UpdateDateColumn()`
- Soft delete where specified: `@DeleteDateColumn() deletedAt: Date | null`
- Decimals: `@Column({ type: 'decimal', precision: 10, scale: 2 })`
- Enums: stored as `type: 'enum'` with a TypeScript `enum` in a sibling `enums/` file
- JSONB: `@Column({ type: 'jsonb' })`
- All entities exported from `entities/` index files
- DTOs use `class-validator` decorators (`@IsString()`, `@IsUUID()`, `@IsOptional()`, etc.)
- No comments unless a non-obvious constraint must be explained

---

## Implementation Order

Follow this order strictly to avoid circular FK startup errors:

1. `Address` embedded value object (no table, used in two entities)
2. `StorageModule` (abstract service + local impl)
3. `Collection` entity + module
4. `Category` + `SubCategory` entities + module
5. `ProductPhoto` entity (no module yet — part of ProductsModule)
6. `Product` entity — `defaultVariantId` set as **nullable**, no `@JoinColumn` yet
7. `ProductVariant` entity — `mainPhotoId` nullable FK → `ProductPhoto`
8. Back-patch `Product`: add `@OneToOne(() => ProductVariant) @JoinColumn() defaultVariant`
9. `Review` entity + module
10. `ShippingMethod` entity + module
11. `SavedAddress` entity + module
12. `Order` + `OrderItem` entities + module
13. Register all modules in `AppModule`
14. Extend `UsersService` for guest→user linking

---

## Entities to Create

### 1. Address Embedded Value Object
**`src/common/embeds/address.embed.ts`**

Not an `@Entity`. Use TypeORM's embedded pattern. Fields:
`firstName`, `lastName`, `company?`, `address1`, `address2?`, `city`, `country`,
`province`, `postalCode`, `phone` — all `@Column()`, optionals with `nullable: true`.

Used via `@Column(() => Address, { prefix: 'shipping' })` and
`@Column(() => Address, { prefix: 'billing' })` in `SavedAddress` and `Order`.

---

### 2. StorageModule (abstract provider, mirrors HashingModule)
**`src/common/storage/`**

```
storage.module.ts        — provides StorageService via LocalStorageService, @Global()
storage.service.ts       — abstract class with:
                             save(file: Express.Multer.File, subPath: string): Promise<string>
                             delete(fileUrl: string): Promise<void>
                             getUrl(subPath: string): string
local-storage.service.ts — stores files in ./uploads/{subPath}, returns relative URL
```

`StorageModule` is `@Global()` and exported. Add static file middleware for `./uploads` in
`main.ts` so uploaded files are accessible via HTTP.

---

### 3. Collection
**`src/collections/entities/collection.entity.ts`**

| Column | TypeORM | Notes |
|---|---|---|
| id | `@PrimaryGeneratedColumn('uuid')` | |
| slug | `@Column({ unique: true })` | kebab-case, e.g. `summer-2025` |
| displayName | `@Column()` | human-readable |
| description | `@Column({ type: 'text', nullable: true })` | |
| bannerImageUrl | `@Column({ nullable: true })` | path from StorageService |
| isActive | `@Column({ default: true })` | |
| products | `@OneToMany(() => Product, p => p.collection)` | |
| createdAt / updatedAt | timestamps | |

Module: `CollectionsModule` — CRUD at `/collections`.
Write routes: `@Auth(AuthType.Bearer)` + `@Roles(Role.ADMIN)`.
Read routes: `@Auth(AuthType.None)`.

---

### 4. Category + SubCategory
**`src/categories/entities/category.entity.ts`**
**`src/categories/entities/subcategory.entity.ts`**

**Category columns:**
`id (uuid PK)`, `slug (unique varchar)`, `displayName`, `subCategories (OneToMany)`, timestamps.

**SubCategory columns:**
`id (uuid PK)`, `slug (varchar)`, `displayName`, `category (ManyToOne)`, `products (OneToMany)`, timestamps.

Add `@Unique(['slug', 'categoryId'])` on SubCategory — slug is unique per category, not globally.

Module: `CategoriesModule` — routes `/categories` and `/categories/:id/subcategories`.

---

### 5. ProductPhoto
**`src/products/entities/product-photo.entity.ts`**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| product | `@ManyToOne(() => Product, p => p.photos, { onDelete: 'CASCADE' })` | |
| url | `@Column()` | path from StorageService |
| altText | `@Column({ nullable: true })` | |
| sortOrder | `@Column({ default: 0 })` | ascending = gallery order |
| createdAt | `@CreateDateColumn()` | |

Managed via `ProductsModule` — no separate module.

---

### 6. Product
**`src/products/entities/product.entity.ts`**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| name | `@Column({ unique: true })` | URL slug with underscores, e.g. `black_wool_cap` |
| displayName | `@Column()` | human-readable |
| collection | `@ManyToOne(() => Collection, { nullable: true, onDelete: 'SET NULL' })` | |
| collectionId | `@Column({ nullable: true })` | |
| category | `@ManyToOne(() => Category, { onDelete: 'RESTRICT' })` | |
| categoryId | `@Column()` | |
| subCategory | `@ManyToOne(() => SubCategory, { onDelete: 'RESTRICT' })` | |
| subCategoryId | `@Column()` | |
| basePrice | `@Column({ type: 'decimal', precision: 10, scale: 2 })` | base; variants can override |
| currency | `@Column({ length: 3 })` | ISO 4217, e.g. `USD` |
| description | `@Column({ type: 'jsonb' })` | `{ blocks: DescriptionBlock[] }` |
| isPublished | `@Column({ default: false })` | false = admin-only |
| defaultVariantId | `@Column({ nullable: true })` | set after variants are created |
| defaultVariant | `@OneToOne(() => ProductVariant, { nullable: true }) @JoinColumn({ name: 'defaultVariantId' })` | |
| photos | `@OneToMany(() => ProductPhoto, p => p.product, { cascade: true })` | product gallery |
| variants | `@OneToMany(() => ProductVariant, v => v.product, { cascade: true })` | |
| reviews | `@OneToMany(() => Review, r => r.product)` | |
| deletedAt | `@DeleteDateColumn()` | soft delete |
| createdAt / updatedAt | timestamps | |

**DescriptionBlock type** (`src/products/types/description-block.type.ts`):
```typescript
export type DescriptionBlock =
  | { type: 'text'; content: string }
  | { type: 'points'; items: string[] };
```

Module: `ProductsModule` — imports `TypeOrmModule.forFeature([Product, ProductVariant, ProductPhoto])`.

Routes:
- `GET /products` — `@Auth(AuthType.None)`, paginated, filter by `collectionId`, `categoryId`, `subCategoryId`; unpublished products hidden from non-admins
- `GET /products/:name` — `@Auth(AuthType.None)`, returns product + defaultVariant; computed `rating` in response
- `GET /products/:name?variant=:sku` — `@Auth(AuthType.None)`, returns specific variant
- `POST /products` — admin only
- `PATCH /products/:id` — admin only
- `DELETE /products/:id` — admin only (soft delete)
- `POST /products/:id/variants` — admin only
- `PATCH /products/:id/variants/:variantId` — admin only
- `POST /products/:id/photos` — admin only (multipart/form-data, uses StorageService)
- `DELETE /products/:id/photos/:photoId` — admin only

---

### 7. ProductVariant
**`src/products/entities/product-variant.entity.ts`**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| product | `@ManyToOne(() => Product, p => p.variants, { onDelete: 'CASCADE' })` | |
| productId | `@Column()` | |
| colorName | `@Column()` | e.g. `Red` |
| colorValue | `@Column()` | e.g. `#FF0000` |
| size | `@Column()` | free-form: `L`, `EU 42`, `One Size` |
| sku | `@Column({ unique: true })` | auto-gen: slugify(`{product.name}-{colorName}-{size}`); admin-overridable |
| stock | `@Column({ default: 0 })` | |
| priceOverride | `@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })` | null = use product.basePrice |
| mainPhotoId | `@Column({ nullable: true })` | FK → ProductPhoto from product gallery |
| mainPhoto | `@ManyToOne(() => ProductPhoto, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'mainPhotoId' })` | |
| createdAt / updatedAt | timestamps | |

**SKU generation** (in `ProductsService`, called before insert):
```typescript
function generateSku(productName: string, colorName: string, size: string): string {
  return [productName, colorName, size]
    .map(s => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    .join('-');
}
```
Admin can pass an explicit `sku` field in the DTO to override the auto-generated value.

---

### 8. Review
**`src/reviews/entities/review.entity.ts`**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| product | `@ManyToOne(() => Product, p => p.reviews, { onDelete: 'CASCADE' })` | |
| productId | `@Column()` | |
| user | `@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })` | |
| userId | `@Column({ nullable: true })` | |
| email | `@Column()` | always stored; key for guest→user linking |
| displayName | `@Column()` | |
| rating | `@Column({ type: 'int' })` | 1–10 |
| content | `@Column({ type: 'text' })` | |
| status | `@Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })` | |
| photoUrls | `@Column({ type: 'simple-array', nullable: true })` | uploaded via StorageService |
| createdAt / updatedAt | timestamps | |

```typescript
// src/reviews/enums/review-status.enum.ts
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
```

Routes:
- `POST /products/:productId/reviews` — `@Auth(AuthType.None)` (any user or guest)
- `DELETE /reviews/:id` — `@Auth(AuthType.Bearer)`; service checks: `Role.ADMIN` OR `userId === review.userId`
- `PATCH /reviews/:id/status` — admin only; body: `{ status: ReviewStatus }`

---

### 9. ShippingMethod
**`src/shipping/entities/shipping-method.entity.ts`**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| name | `@Column()` | e.g. `Standard Shipping` |
| price | `@Column({ type: 'decimal', precision: 10, scale: 2 })` | |
| currency | `@Column({ length: 3 })` | ISO 4217 |
| estimatedDays | `@Column({ nullable: true })` | |
| isActive | `@Column({ default: true })` | |
| createdAt / updatedAt | timestamps | |

Routes: `GET /shipping-methods` (public), write routes admin only.

---

### 10. SavedAddress
**`src/addresses/entities/saved-address.entity.ts`**

```typescript
@Entity()
export class SavedAddress {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  name: string; // e.g. "My Home"

  @Column(() => Address, { prefix: 'shipping' })
  shippingAddress: Address;

  @Column(() => Address, { prefix: 'billing' })
  billingAddress: Address;

  @Column({ default: false })
  billingIsSameAsShipping: boolean;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

Routes at `/addresses` — all routes require `@Auth(AuthType.Bearer)` (registered users only).

---

### 11. Order + OrderItem
**`src/orders/entities/order.entity.ts`**
**`src/orders/entities/order-item.entity.ts`**

**Enums:**
```typescript
// src/orders/enums/payment-status.enum.ts
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// src/orders/enums/fulfillment-status.enum.ts
export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  FULFILLED = 'fulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  CANCELLED = 'cancelled',
}
```

**Order columns:**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| orderNumber | `@Column({ unique: true })` | `O2SHOP-000001` |
| orderSequence | `@Column()` | integer; incremented in transaction |
| user | `@ManyToOne(() => User, { nullable: true })` | |
| userId | `@Column({ nullable: true })` | |
| guestEmail | `@Column({ nullable: true })` | cleared and userId set on registration |
| guestFirstName | `@Column({ nullable: true })` | |
| guestLastName | `@Column({ nullable: true })` | |
| paymentStatus | `enum PaymentStatus DEFAULT PENDING` | |
| fulfillmentStatus | `enum FulfillmentStatus DEFAULT UNFULFILLED` | |
| totalAmount | `decimal(10,2)` | |
| totalCurrency | `@Column({ length: 3 })` | |
| shippingMethod | `@ManyToOne(() => ShippingMethod, { nullable: true })` | reference only |
| shippingMethodName | `@Column()` | **captured at purchase** |
| shippingPrice | `decimal(10,2)` | **captured at purchase** |
| shippingCurrency | `@Column({ length: 3 })` | **captured at purchase** |
| shippingAddress | `@Column(() => Address, { prefix: 'shipping' })` | captured at purchase |
| billingAddress | `@Column(() => Address, { prefix: 'billing' })` | captured at purchase |
| paymentProviderId | `@Column({ nullable: true })` | e.g. `stripe`, `paypal` |
| paymentProviderRef | `@Column({ nullable: true })` | provider's transaction/intent ID |
| items | `@OneToMany(() => OrderItem, i => i.order, { cascade: true })` | |
| createdAt / updatedAt | timestamps | |

**Order number generation** (inside `OrdersService.create()`, wrapped in TypeORM transaction with pessimistic write lock):
```typescript
const last = await manager.findOne(Order, {
  order: { orderSequence: 'DESC' },
  lock: { mode: 'pessimistic_write' },
});
const seq = (last?.orderSequence ?? 0) + 1;
const orderNumber = `O2SHOP-${String(seq).padStart(6, '0')}`;
```

**OrderItem columns:**

| Column | TypeORM | Notes |
|---|---|---|
| id | uuid PK | |
| order | `@ManyToOne(() => Order, o => o.items, { onDelete: 'CASCADE' })` | |
| product | `@ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })` | reference only |
| productId | `@Column({ nullable: true })` | |
| productName | `@Column()` | **captured at purchase** |
| productSku | `@Column()` | **captured at purchase** |
| productPrice | `decimal(10,2)` | **captured at purchase** |
| productCurrency | `@Column({ length: 3 })` | **captured at purchase** |
| quantity | `@Column({ type: 'int' })` | |
| total | `decimal(10,2)` | `productPrice × quantity`, computed before insert |
| createdAt | `@CreateDateColumn()` | |

**Routes:**
- `POST /orders` — `@Auth(AuthType.None)` (guest or authenticated); validates variant stock before insert
- `GET /orders` — admin only (all orders, paginated)
- `GET /orders/my` — `@Auth(AuthType.Bearer)` (current user's orders)
- `GET /orders/:orderNumber` — `@Auth(AuthType.None)` (guest can view by order number)
- `PATCH /orders/:id/status` — admin only; body: `{ paymentStatus?, fulfillmentStatus? }`

---

## Guest → User Linking (extend UsersService)

After a new `User` is created (local registration or first Google OAuth sign-in),
inside the **same transaction**, run:

```typescript
await manager.update(Order,
  { guestEmail: newUser.email },
  { userId: newUser.id, guestEmail: null, guestFirstName: null, guestLastName: null },
);
await manager.update(Review,
  { email: newUser.email, userId: IsNull() },
  { userId: newUser.id },
);
```

---

## AppModule Registration

Add to `src/app.module.ts` imports array:
```typescript
imports: [
  ConfigModule,
  DatabaseModule,
  AuthModule,
  CollectionsModule,
  CategoriesModule,
  ProductsModule,
  ReviewsModule,
  ShippingModule,
  AddressesModule,
  OrdersModule,
]
```

`StorageModule` is `@Global()` — no need to import it in each feature module.
TypeORM `autoLoadEntities: true` picks up entities automatically via `forFeature([...])`.

---

## DTOs

Each create/update operation needs a DTO. Rules:
- Required string: `@IsString() @IsNotEmpty()`
- Optional string: `@IsString() @IsOptional()`
- UUID: `@IsUUID()`
- Number: `@IsNumber()` / `@IsInt()`
- Enum: `@IsEnum(SomeEnum)`
- Decimal: `@Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 })`
- Nested object: `@ValidateNested() @Type(() => AddressDto)`
- Array: `@IsArray() @ArrayNotEmpty()`

`AddressDto` must validate all required address fields and is reused in both `CreateOrderDto`
and `CreateSavedAddressDto`.

---

## Verification Checklist

After running `pnpm run start:dev`:

1. `pnpm run lint` passes — no TypeScript errors
2. All tables created in PostgreSQL — verify with `\dt` in psql
3. Embedded Address columns have correct prefixes:
   - `SavedAddress` → `shipping_first_name`, `billing_first_name`, etc.
   - `Order` → `shipping_first_name`, `billing_first_name`, etc.
4. `SubCategory` has composite unique constraint on `(slug, categoryId)` — verify via `\d sub_category`
5. `ProductVariant.sku` is globally unique — verify constraint in schema
6. `POST /auth/register` with email matching a prior guest order → `Order.userId` populated, `guestEmail` cleared
7. `GET /products/:name` returns computed `rating` (AVG of APPROVED reviews only) in response DTO
8. `POST /products/:id/photos` (multipart) → file appears in `./uploads/`, returned URL is accessible via HTTP
