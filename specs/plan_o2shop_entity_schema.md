# O2Shop Backend — Entity Schema Architecture Plan

## Context

Designing the entity layer for a production-ready clothing online store built on the existing NestJS codebase (`nest-o2shop`). The existing foundation provides Auth (JWT + Google OAuth + Local), a `User` entity, TypeORM + PostgreSQL, and abstract-service patterns (e.g. `HashingModule`). All new modules must follow existing conventions.

---

## Design Decisions (confirmed with user)

| Decision | Choice |
|---|---|
| Variant model | Color+size combined pair, each variant has own stock + optional price override |
| SKU | Auto-generated (`{product_name}-{color}-{size}`) with admin override |
| Category / SubCategory | Dynamic DB entities, admin-managed |
| Collection | Full DB entity (slug, description, banner image) |
| Image storage | Abstract `StorageService` → `LocalStorageService` (swappable, mirrors `HashingModule`) |
| Guest identity | No guest entity; `Order.email` holds the email; linked to `User` on registration |
| Order number | `O2SHOP-000001` (prefix + zero-padded sequence) |
| Currency | Per-product; ISO 4217 3-char code |
| Product visibility | `isPublished: boolean` (two levels: public / admin-only) |
| Review ownership | `email` stored on review; links to `User` account on registration |
| Description | `JSONB` with typed blocks: `{ blocks: [{type, ...}] }` |
| Shipping methods | Dynamic DB entity, admin-managed |
| Order line items | Separate `OrderItem` entity (normalized, queryable) |
| Saved addresses | `SavedAddress` with two TypeORM embedded `Address` value objects |
| Product rating | Computed in service (`AVG` over approved reviews), returned in response DTO |
| Product photos | Product-level gallery (`ProductPhoto`); each `ProductVariant` has `mainPhotoId` FK into that gallery |
| Soft delete | Products use `@DeleteDateColumn` (consistent with `User`) |
| Admin roles | Existing `Role.ADMIN` is sufficient, no super-admin |
| Payment | Generic fields: `paymentProviderId`, `paymentProviderRef` + `PaymentStatus` enum |

---

## Entity Schemas

### Shared: Address (Embedded Value Object)
**File:** `src/common/embeds/address.embed.ts`

```typescript
export class Address {
  @Column() firstName: string;
  @Column() lastName: string;
  @Column({ nullable: true }) company?: string;
  @Column() address1: string;
  @Column({ nullable: true }) address2?: string;
  @Column() city: string;
  @Column() country: string;
  @Column() province: string;
  @Column() postalCode: string;
  @Column() phone: string;
}
```

Used via `@Column(() => Address)` in `SavedAddress` and `Order`. TypeORM prefixes columns automatically (`shipping_first_name`, `billing_first_name`, etc.).

---

### Collection
**File:** `src/collections/entities/collection.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | varchar UNIQUE | URL-safe, e.g. `summer-2025` |
| displayName | varchar | Human-readable |
| description | text nullable | |
| bannerImageUrl | varchar nullable | From `StorageService` |
| isActive | boolean DEFAULT true | |
| products | OneToMany → Product | |
| createdAt / updatedAt | timestamps | |

---

### Category
**File:** `src/categories/entities/category.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | varchar UNIQUE | e.g. `headwear` |
| displayName | varchar | |
| subCategories | OneToMany → SubCategory | |
| createdAt / updatedAt | timestamps | |

### SubCategory
**File:** `src/categories/entities/subcategory.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | varchar | unique within category |
| displayName | varchar | e.g. `Ushanka`, `Cap` |
| category | ManyToOne → Category | |
| products | OneToMany → Product | |
| createdAt / updatedAt | timestamps | |

---

### ProductPhoto
**File:** `src/products/entities/product-photo.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| product | ManyToOne → Product CASCADE | |
| url | varchar | From `StorageService` |
| altText | varchar nullable | |
| sortOrder | int DEFAULT 0 | For gallery ordering |
| createdAt | timestamp | |

---

### Product
**File:** `src/products/entities/product.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | varchar UNIQUE | URL slug, underscores, e.g. `example_shirt` |
| displayName | varchar | Human-readable display |
| collection | ManyToOne → Collection nullable | |
| category | ManyToOne → Category | |
| subCategory | ManyToOne → SubCategory | |
| basePrice | decimal(10,2) | Base price; variants can override |
| currency | char(3) | ISO 4217, e.g. `USD` |
| description | jsonb | `{ blocks: DescriptionBlock[] }` |
| isPublished | boolean DEFAULT false | Public vs admin-only |
| defaultVariantId | varchar nullable | FK → ProductVariant |
| defaultVariant | OneToOne → ProductVariant nullable | `@JoinColumn` |
| photos | OneToMany → ProductPhoto | Full gallery |
| variants | OneToMany → ProductVariant | |
| reviews | OneToMany → Review | |
| deletedAt | timestamp nullable | `@DeleteDateColumn` |
| createdAt / updatedAt | timestamps | |

**`DescriptionBlock` type** (`src/products/types/description-block.type.ts`):
```typescript
type DescriptionBlock =
  | { type: 'text'; content: string }
  | { type: 'points'; items: string[] }
```

---

### ProductVariant
**File:** `src/products/entities/product-variant.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| product | ManyToOne → Product CASCADE | |
| productId | varchar | Exposed for FK joins |
| colorName | varchar | e.g. `Red` |
| colorValue | varchar | e.g. `#FF0000` |
| size | varchar | Free-form: `L`, `EU 42`, `One Size` |
| sku | varchar UNIQUE | Auto-generated: `{product.name}-{color}-{size}`, admin-overridable |
| stock | int DEFAULT 0 | |
| priceOverride | decimal(10,2) nullable | If null, use `product.basePrice` |
| mainPhotoId | varchar nullable | FK → ProductPhoto (from product gallery) |
| mainPhoto | ManyToOne → ProductPhoto nullable | `@JoinColumn` |
| createdAt / updatedAt | timestamps | |

**Circular FK note:** `Product.defaultVariantId → ProductVariant` and `ProductVariant.productId → Product`. TypeORM handles this: create Product first (defaultVariantId = null), create variants, then set defaultVariantId.

---

### Review
**File:** `src/reviews/entities/review.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| product | ManyToOne → Product | |
| user | ManyToOne → User nullable | Set if reviewer is registered |
| userId | varchar nullable | |
| email | varchar | Always stored; used to link guest reviews on registration |
| displayName | varchar | |
| rating | int | 1–10 |
| content | text | |
| status | enum ReviewStatus | PENDING / APPROVED / REJECTED |
| photoUrls | simple-array nullable | Uploaded via `StorageService` |
| createdAt / updatedAt | timestamps | |

**ReviewStatus enum** (`src/reviews/enums/review-status.enum.ts`):
```typescript
export enum ReviewStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected' }
```

---

### SavedAddress
**File:** `src/addresses/entities/saved-address.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user | ManyToOne → User CASCADE | Registered users only |
| name | varchar | e.g. `My Home` |
| shippingAddress | embedded Address | Prefix: `shipping_` |
| billingAddress | embedded Address | Prefix: `billing_` |
| billingIsSameAsShipping | boolean DEFAULT false | |
| createdAt / updatedAt | timestamps | |

---

### ShippingMethod
**File:** `src/shipping/entities/shipping-method.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | varchar | e.g. `Standard Shipping` |
| price | decimal(10,2) | |
| currency | char(3) | ISO 4217 |
| estimatedDays | int nullable | |
| isActive | boolean DEFAULT true | |
| createdAt / updatedAt | timestamps | |

---

### Order
**File:** `src/orders/entities/order.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| orderNumber | varchar UNIQUE | `O2SHOP-000001` |
| orderSequence | int | Used to generate orderNumber; increment atomically in transaction |
| user | ManyToOne → User nullable | Set for registered users |
| userId | varchar nullable | |
| email | varchar nullable | Set for guests; used for post-registration linking |
| firstName | varchar nullable | |
| lastName | varchar nullable | |
| paymentStatus | enum PaymentStatus | PENDING / PAID / FAILED / REFUNDED |
| fulfillmentStatus | enum FulfillmentStatus | UNFULFILLED / FULFILLED / PARTIALLY_FULFILLED / CANCELLED |
| totalAmount | decimal(10,2) | |
| totalCurrency | char(3) | |
| shippingMethodId | varchar nullable | FK → ShippingMethod (reference) |
| shippingMethod | ManyToOne → ShippingMethod nullable | |
| shippingMethodName | varchar | Captured at purchase |
| shippingPrice | decimal(10,2) | Captured at purchase |
| shippingCurrency | char(3) | Captured at purchase |
| shippingAddress | embedded Address | Prefix: `shipping_` |
| billingAddress | embedded Address | Prefix: `billing_` |
| paymentProviderId | varchar nullable | e.g. `stripe`, `paypal` |
| paymentProviderRef | varchar nullable | e.g. Stripe PaymentIntent ID |
| items | OneToMany → OrderItem cascade | |
| createdAt / updatedAt | timestamps | |

**Enums:** `src/orders/enums/payment-status.enum.ts`, `src/orders/enums/fulfillment-status.enum.ts`

**Order number generation** (in `OrdersService.create()`, inside a transaction):
```typescript
const last = await this.orderRepo.findOne({ order: { orderSequence: 'DESC' } });
const seq = (last?.orderSequence ?? 0) + 1;
const orderNumber = `O2SHOP-${String(seq).padStart(6, '0')}`;
```

---

### OrderItem
**File:** `src/orders/entities/order-item.entity.ts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order | ManyToOne → Order CASCADE | |
| productId | varchar nullable | Reference (soft-deleted products still exist) |
| product | ManyToOne → Product nullable | |
| productName | varchar | Captured at purchase |
| productSku | varchar | Captured at purchase |
| productPrice | decimal(10,2) | Captured at purchase |
| productCurrency | char(3) | Captured at purchase |
| quantity | int | |
| total | decimal(10,2) | `price × quantity`, computed before insert |
| createdAt | timestamp | |

---

## New Module Structure

```
src/
  common/
    embeds/
      address.embed.ts           ← shared Address embedded entity
    storage/
      storage.module.ts
      storage.service.ts         ← abstract (mirrors HashingService)
      local-storage.service.ts   ← default implementation

  collections/
    collections.module.ts
    collections.service.ts
    collections.controller.ts
    entities/collection.entity.ts
    dto/create-collection.dto.ts, update-collection.dto.ts

  categories/
    categories.module.ts
    categories.service.ts
    categories.controller.ts
    entities/
      category.entity.ts
      subcategory.entity.ts
    dto/create-category.dto.ts, create-subcategory.dto.ts

  products/
    products.module.ts
    products.service.ts
    products.controller.ts
    entities/
      product.entity.ts
      product-variant.entity.ts
      product-photo.entity.ts
    types/description-block.type.ts
    dto/create-product.dto.ts, update-product.dto.ts, create-variant.dto.ts

  reviews/
    reviews.module.ts
    reviews.service.ts
    reviews.controller.ts
    entities/review.entity.ts
    enums/review-status.enum.ts
    dto/create-review.dto.ts

  addresses/
    addresses.module.ts
    addresses.service.ts
    addresses.controller.ts
    entities/saved-address.entity.ts
    dto/create-saved-address.dto.ts

  shipping/
    shipping.module.ts
    shipping.service.ts
    shipping.controller.ts
    entities/shipping-method.entity.ts
    dto/create-shipping-method.dto.ts

  orders/
    orders.module.ts
    orders.service.ts
    orders.controller.ts
    entities/
      order.entity.ts
      order-item.entity.ts
    enums/
      payment-status.enum.ts
      fulfillment-status.enum.ts
    dto/create-order.dto.ts, update-order-status.dto.ts
```

---

## AppModule Registration

Add all new modules to `src/app.module.ts`:
```typescript
imports: [
  ConfigModule, DatabaseModule, AuthModule,
  CollectionsModule, CategoriesModule, ProductsModule,
  ReviewsModule, AddressesModule, ShippingModule, OrdersModule,
]
```

TypeORM `autoLoadEntities: true` in `database.config.ts` means entities register automatically when their module imports `TypeOrmModule.forFeature([...])`.

---

## Guest → User Order Linking

When a registered user is created via `AuthService.createFromLocal()` (or Google OAuth):
1. Find all `Order` rows where `email = newUser.email`
2. Set `userId = newUser.id`, clear `email`
3. Find all `Review` rows where `email = newUser.email` and `userId IS NULL`
4. Set `userId = newUser.id`

This is done atomically in the existing transaction in `UsersService`.

---

## StorageModule Pattern

Mirrors existing `HashingModule`:

```typescript
// storage.service.ts
export abstract class StorageService {
  abstract save(file: Express.Multer.File, path: string): Promise<string>;
  abstract delete(url: string): Promise<void>;
  abstract getUrl(path: string): string;
}

// storage.module.ts
@Module({
  providers: [{ provide: StorageService, useClass: LocalStorageService }],
  exports: [StorageService],
})
export class StorageModule {}
```

---

## Critical Files to Create / Modify

| File | Action |
|---|---|
| `src/app.module.ts` | Add all new module imports |
| `src/common/embeds/address.embed.ts` | Create |
| `src/common/storage/storage.module.ts` | Create |
| `src/common/storage/storage.service.ts` | Create (abstract) |
| `src/common/storage/local-storage.service.ts` | Create |
| `src/collections/entities/collection.entity.ts` | Create |
| `src/categories/entities/category.entity.ts` | Create |
| `src/categories/entities/subcategory.entity.ts` | Create |
| `src/products/entities/product.entity.ts` | Create |
| `src/products/entities/product-variant.entity.ts` | Create |
| `src/products/entities/product-photo.entity.ts` | Create |
| `src/products/types/description-block.type.ts` | Create |
| `src/reviews/entities/review.entity.ts` | Create |
| `src/reviews/enums/review-status.enum.ts` | Create |
| `src/addresses/entities/saved-address.entity.ts` | Create |
| `src/shipping/entities/shipping-method.entity.ts` | Create |
| `src/orders/entities/order.entity.ts` | Create |
| `src/orders/entities/order-item.entity.ts` | Create |
| `src/orders/enums/payment-status.enum.ts` | Create |
| `src/orders/enums/fulfillment-status.enum.ts` | Create |
| `src/users/users.service.ts` | Extend: add guest→user order+review linking on registration |

---

## Verification

1. Run `pnpm run start:dev` — TypeORM `synchronize: true` will auto-create all tables
2. Check PostgreSQL tables via `psql` or a DB GUI: all entities should produce correct column names (especially embedded Address prefixes)
3. Run `pnpm run lint` — no type errors
4. Manually POST to `POST /auth/register` and verify the guest email linking query runs
5. Verify circular FK between `Product.defaultVariantId` and `ProductVariant.productId` doesn't cause startup errors (TypeORM handles via `nullable: true` + deferred constraint)
