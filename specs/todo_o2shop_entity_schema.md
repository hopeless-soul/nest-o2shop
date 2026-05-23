# O2Shop Entity Schema — Implementation Tracker

> Reference spec: [plan_o2shop_entity_schema_enhanced.md](./plan_o2shop_entity_schema_enhanced.md)
> Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Prerequisites

- [x] Invoke `/nestjs-best-practices` skill before writing any code
- [x] Confirm `pnpm run start:dev` starts cleanly on current codebase

---

## Phase 1 — Shared Infrastructure

### 1.1 Address Embedded Value Object
> `src/common/embeds/address.embed.ts`

- [x] Create `Address` class (not `@Entity`)
  - [x] `firstName`, `lastName` — `@Column()`
  - [x] `company?` — `@Column({ nullable: true })`
  - [x] `address1` — `@Column()`
  - [x] `address2?` — `@Column({ nullable: true })`
  - [x] `city`, `country`, `province`, `postalCode`, `phone` — `@Column()`

### 1.2 StorageModule
> `src/common/storage/`

- [x] `storage.service.ts` — abstract class
  - [x] `save(file: Express.Multer.File, subPath: string): Promise<string>`
  - [x] `delete(fileUrl: string): Promise<void>`
  - [x] `getUrl(subPath: string): string`
- [x] `local-storage.service.ts` — concrete impl
  - [x] Stores files in `./uploads/{subPath}`
  - [x] Returns relative URL string
- [x] `storage.module.ts`
  - [x] `@Global()` decorator
  - [x] Provides `StorageService` via `LocalStorageService`
  - [x] Exports `StorageService`
- [x] `main.ts` — add static file middleware for `./uploads`

> Comment:
> - Added `ValidationPipe` globally in `main.ts` with `whitelist: true, transform: true`
> - Installed `@types/multer` to resolve `Express.Multer.File` types
> - Added `role: Role` to `User` entity + updated `CurrentUserData` and `AccessTokenPayload` to include `role`
> - Created `RolesGuard` + `@Roles()` decorator, registered as global `APP_GUARD` after `AuthenticationGuard`
> - `JwtStrategy.validate()` now fetches `role` from DB alongside `tokenVersion`

---

## Phase 2 — Catalogue Structure

### 2.1 Collection
> `src/collections/`

- [x] `entities/collection.entity.ts`
  - [x] `id` — uuid PK
  - [x] `slug` — unique varchar (kebab-case)
  - [x] `displayName` — varchar
  - [x] `description` — text nullable
  - [x] `bannerImageUrl` — varchar nullable
  - [x] `isActive` — boolean DEFAULT true
  - [x] `products` — OneToMany → Product
  - [x] `createdAt`, `updatedAt` — timestamps
- [x] `collections.module.ts` — `TypeOrmModule.forFeature([Collection])`
- [x] `collections.service.ts` — CRUD methods
- [x] `collections.controller.ts`
  - [x] `GET /collections` — `@Auth(AuthType.None)`
  - [x] `GET /collections/:id` — `@Auth(AuthType.None)`
  - [x] `POST /collections` — admin only
  - [x] `PATCH /collections/:id` — admin only
  - [x] `DELETE /collections/:id` — admin only
- [x] `dto/create-collection.dto.ts`
- [x] `dto/update-collection.dto.ts`

### 2.2 Category + SubCategory
> `src/categories/`

- [x] `entities/category.entity.ts`
  - [x] `id` — uuid PK
  - [x] `slug` — unique varchar
  - [x] `displayName` — varchar
  - [x] `subCategories` — OneToMany → SubCategory
  - [x] `createdAt`, `updatedAt`
- [x] `entities/subcategory.entity.ts`
  - [x] `id` — uuid PK
  - [x] `slug` — varchar
  - [x] `displayName` — varchar
  - [x] `category` — ManyToOne → Category
  - [x] `products` — OneToMany → Product
  - [x] `createdAt`, `updatedAt`
  - [x] `@Unique(['slug', 'categoryId'])` — slug unique per category
- [x] `categories.module.ts` — `TypeOrmModule.forFeature([Category, SubCategory])`
- [x] `categories.service.ts` — CRUD for both Category and SubCategory
- [x] `categories.controller.ts`
  - [x] `GET /categories` — `@Auth(AuthType.None)`
  - [x] `GET /categories/:id` — `@Auth(AuthType.None)`
  - [x] `POST /categories` — admin only
  - [x] `PATCH /categories/:id` — admin only
  - [x] `DELETE /categories/:id` — admin only
  - [x] `GET /categories/:id/subcategories` — `@Auth(AuthType.None)`
  - [x] `POST /categories/:id/subcategories` — admin only
  - [x] `PATCH /categories/:id/subcategories/:subId` — admin only
  - [x] `DELETE /categories/:id/subcategories/:subId` — admin only
- [x] `dto/create-category.dto.ts`
- [x] `dto/create-subcategory.dto.ts`

> Comment:
> - TypeORM 1.0.0 uses object-style relations `{ subCategories: true }` not string arrays

---

## Phase 3 — Products

### 3.1 ProductPhoto entity (no module — part of ProductsModule)
> `src/products/entities/product-photo.entity.ts`

- [x] `id` — uuid PK
- [x] `product` — ManyToOne → Product `onDelete: CASCADE`
- [x] `url` — varchar (path from StorageService)
- [x] `altText` — varchar nullable
- [x] `sortOrder` — int DEFAULT 0
- [x] `createdAt` — `@CreateDateColumn()`

### 3.2 Product entity (initial — defaultVariantId nullable, no @JoinColumn yet)
> `src/products/entities/product.entity.ts`

- [x] `id` — uuid PK
- [x] `name` — unique varchar (URL slug, underscores)
- [x] `displayName` — varchar
- [x] `collection` — ManyToOne → Collection nullable `onDelete: SET NULL`
- [x] `collectionId` — varchar nullable
- [x] `category` — ManyToOne → Category `onDelete: RESTRICT`
- [x] `categoryId` — varchar
- [x] `subCategory` — ManyToOne → SubCategory `onDelete: RESTRICT`
- [x] `subCategoryId` — varchar
- [x] `basePrice` — decimal(10,2)
- [x] `currency` — char(3) ISO 4217
- [x] `description` — jsonb `{ blocks: DescriptionBlock[] }`
- [x] `isPublished` — boolean DEFAULT false
- [x] `defaultVariantId` — varchar nullable (FK added after variants step)
- [x] `photos` — OneToMany → ProductPhoto cascade
- [x] `variants` — OneToMany → ProductVariant cascade
- [x] `reviews` — OneToMany → Review
- [x] `deletedAt` — `@DeleteDateColumn()`
- [x] `createdAt`, `updatedAt`
- [x] `types/description-block.type.ts` — `DescriptionBlock` union type

### 3.3 ProductVariant entity
> `src/products/entities/product-variant.entity.ts`

- [x] `id` — uuid PK
- [x] `product` — ManyToOne → Product `onDelete: CASCADE`
- [x] `productId` — varchar
- [x] `colorName` — varchar
- [x] `colorValue` — varchar (e.g. `#FF0000`)
- [x] `size` — varchar (free-form)
- [x] `sku` — unique varchar (auto-generated, admin-overridable)
- [x] `stock` — int DEFAULT 0
- [x] `priceOverride` — decimal(10,2) nullable
- [x] `mainPhotoId` — varchar nullable
- [x] `mainPhoto` — ManyToOne → ProductPhoto nullable `onDelete: SET NULL`
- [x] `createdAt`, `updatedAt`
- [x] `generateSku()` helper in `products.service.ts`

### 3.4 Back-patch Product — add defaultVariant relation
> `src/products/entities/product.entity.ts`

- [x] Add `defaultVariant` — `@OneToOne(() => ProductVariant, { nullable: true }) @JoinColumn({ name: 'defaultVariantId' })`

### 3.5 ProductsModule
> `src/products/`

- [x] `products.module.ts` — `TypeOrmModule.forFeature([Product, ProductVariant, ProductPhoto])`
- [x] `products.service.ts`
  - [x] `findAll()` — paginated, filterable, hides unpublished from non-admins
  - [x] `findByName(name)` — returns product + defaultVariant + computed rating
  - [x] `findByNameAndVariant(name, sku)` — returns specific variant
  - [x] `create()` — admin
  - [x] `update()` — admin
  - [x] `softDelete()` — admin
  - [x] `createVariant()` — generates SKU, admin
  - [x] `updateVariant()` — admin
  - [x] `addPhoto()` — calls StorageService, admin
  - [x] `deletePhoto()` — calls StorageService, admin
  - [x] `setDefaultVariant()` — admin
  - [x] `computeRating(productId)` — `AVG` over APPROVED reviews
- [x] `products.controller.ts`
  - [x] `GET /products` — `@Auth(AuthType.None)`
  - [x] `GET /products/:name` — `@Auth(AuthType.None)`
  - [x] `POST /products` — admin only
  - [x] `PATCH /products/:id` — admin only
  - [x] `DELETE /products/:id` — admin only
  - [x] `POST /products/:id/variants` — admin only
  - [x] `PATCH /products/:id/variants/:variantId` — admin only
  - [x] `POST /products/:id/photos` — admin only (multipart/form-data)
  - [x] `DELETE /products/:id/photos/:photoId` — admin only
- [x] `dto/create-product.dto.ts`
- [x] `dto/update-product.dto.ts`
- [x] `dto/create-variant.dto.ts`
- [x] `dto/update-variant.dto.ts`

> Comment:
> - `ProductDescription` interface imported with `import type` to satisfy `isolatedModules` + `emitDecoratorMetadata` constraint
> - `setDefaultVariant` exposed as `POST /products/:id/variants/:variantId/default` (not in original spec but needed)
> - `findByNameAndVariant` not implemented as separate controller route — variant returned inline with product

---

## Phase 4 — Reviews

### 4.1 Review entity + module
> `src/reviews/`

- [x] `enums/review-status.enum.ts` — `PENDING | APPROVED | REJECTED`
- [x] `entities/review.entity.ts`
  - [x] `id` — uuid PK
  - [x] `product` — ManyToOne → Product `onDelete: CASCADE`
  - [x] `productId` — varchar
  - [x] `user` — ManyToOne → User nullable `onDelete: SET NULL`
  - [x] `userId` — varchar nullable
  - [x] `email` — varchar (always stored)
  - [x] `displayName` — varchar
  - [x] `rating` — int (1–10)
  - [x] `content` — text
  - [x] `status` — enum ReviewStatus DEFAULT PENDING
  - [x] `photoUrls` — simple-array nullable
  - [x] `createdAt`, `updatedAt`
- [x] `reviews.module.ts` — `TypeOrmModule.forFeature([Review])`
- [x] `reviews.service.ts`
  - [x] `create()` — sets userId if request has authenticated user, else email only
  - [x] `delete()` — admin OR review owner check
  - [x] `updateStatus()` — admin only
- [x] `reviews.controller.ts`
  - [x] `POST /products/:productId/reviews` — `@Auth(AuthType.None)`
  - [x] `DELETE /reviews/:id` — `@Auth(AuthType.Bearer)`
  - [x] `PATCH /reviews/:id/status` — admin only
- [x] `dto/create-review.dto.ts`

---

## Phase 5 — Shipping

### 5.1 ShippingMethod entity + module
> `src/shipping/`

- [x] `entities/shipping-method.entity.ts`
  - [x] `id` — uuid PK
  - [x] `name` — varchar
  - [x] `price` — decimal(10,2)
  - [x] `currency` — char(3)
  - [x] `estimatedDays` — int nullable
  - [x] `isActive` — boolean DEFAULT true
  - [x] `createdAt`, `updatedAt`
- [x] `shipping.module.ts` — `TypeOrmModule.forFeature([ShippingMethod])`
- [x] `shipping.service.ts` — CRUD
- [x] `shipping.controller.ts`
  - [x] `GET /shipping-methods` — `@Auth(AuthType.None)` (active only for public)
  - [x] `POST /shipping-methods` — admin only
  - [x] `PATCH /shipping-methods/:id` — admin only
  - [x] `DELETE /shipping-methods/:id` — admin only
- [x] `dto/create-shipping-method.dto.ts`

---

## Phase 6 — Addresses

### 6.1 SavedAddress entity + module
> `src/addresses/`

- [x] `entities/saved-address.entity.ts`
  - [x] `id` — uuid PK
  - [x] `user` — ManyToOne → User `onDelete: CASCADE`
  - [x] `name` — varchar (e.g. `My Home`)
  - [x] `shippingAddress` — embedded Address `prefix: 'shipping'`
  - [x] `billingAddress` — embedded Address `prefix: 'billing'`
  - [x] `billingIsSameAsShipping` — boolean DEFAULT false
  - [x] `createdAt`, `updatedAt`
- [x] `addresses.module.ts` — `TypeOrmModule.forFeature([SavedAddress])`
- [x] `addresses.service.ts` — CRUD scoped to current user
- [x] `addresses.controller.ts` — all routes `@Auth(AuthType.Bearer)`
  - [x] `GET /addresses` — current user's saved addresses
  - [x] `POST /addresses`
  - [x] `PATCH /addresses/:id`
  - [x] `DELETE /addresses/:id`
- [x] `dto/create-saved-address.dto.ts` — includes `AddressDto` nested ×2
- [x] `dto/address.dto.ts` — reusable `AddressDto` (also used in `CreateOrderDto`)

---

## Phase 7 — Orders

### 7.1 Order + OrderItem entities + module
> `src/orders/`

- [x] `enums/payment-status.enum.ts` — `PENDING | PAID | FAILED | REFUNDED`
- [x] `enums/fulfillment-status.enum.ts` — `UNFULFILLED | FULFILLED | PARTIALLY_FULFILLED | CANCELLED`
- [x] `entities/order.entity.ts`
  - [x] `id` — uuid PK
  - [x] `orderNumber` — unique varchar (`O2SHOP-000001`)
  - [x] `orderSequence` — int (used to generate orderNumber in transaction)
  - [x] `user` — ManyToOne → User nullable
  - [x] `userId` — varchar nullable
  - [x] `email` — varchar nullable
  - [x] `firstName` — varchar nullable
  - [x] `lastName` — varchar nullable
  - [x] `paymentStatus` — enum DEFAULT PENDING
  - [x] `fulfillmentStatus` — enum DEFAULT UNFULFILLED
  - [x] `totalAmount` — decimal(10,2)
  - [x] `totalCurrency` — char(3)
  - [x] `shippingMethod` — ManyToOne → ShippingMethod nullable
  - [x] `shippingMethodName` — varchar (captured at purchase)
  - [x] `shippingPrice` — decimal(10,2) (captured at purchase)
  - [x] `shippingCurrency` — char(3) (captured at purchase)
  - [x] `shippingAddress` — embedded Address `prefix: 'shipping'` (captured at purchase)
  - [x] `billingAddress` — embedded Address `prefix: 'billing'` (captured at purchase)
  - [x] `paymentProviderId` — varchar nullable
  - [x] `paymentProviderRef` — varchar nullable
  - [x] `items` — OneToMany → OrderItem cascade
  - [x] `createdAt`, `updatedAt`
- [x] `entities/order-item.entity.ts`
  - [x] `id` — uuid PK
  - [x] `order` — ManyToOne → Order `onDelete: CASCADE`
  - [x] `product` — ManyToOne → Product nullable `onDelete: SET NULL`
  - [x] `productId` — varchar nullable
  - [x] `productName` — varchar (captured)
  - [x] `productSku` — varchar (captured)
  - [x] `productPrice` — decimal(10,2) (captured)
  - [x] `productCurrency` — char(3) (captured)
  - [x] `quantity` — int
  - [x] `total` — decimal(10,2) (`price × qty`, computed before insert)
  - [x] `createdAt`
- [x] `orders.module.ts` — `TypeOrmModule.forFeature([Order, OrderItem])`
- [x] `orders.service.ts`
  - [x] `create()` — validates stock, pessimistic-lock order sequence, generates `O2SHOP-NNNNNN`, captures shipping snapshot
  - [x] `findAll()` — admin only, paginated
  - [x] `findMine(userId)` — current user's orders
  - [x] `findByOrderNumber(orderNumber)` — public
  - [x] `updateStatus()` — admin only
- [x] `orders.controller.ts`
  - [x] `POST /orders` — `@Auth(AuthType.None)`
  - [x] `GET /orders` — admin only
  - [x] `GET /orders/my` — `@Auth(AuthType.Bearer)`
  - [x] `GET /orders/:orderNumber` — `@Auth(AuthType.None)`
  - [x] `PATCH /orders/:id/status` — admin only
- [x] `dto/create-order.dto.ts` — includes `AddressDto` ×2, line items array, shippingMethodId
- [x] `dto/update-order-status.dto.ts`

> Comment:
> - Order stock decrement uses `pessimistic_write` lock on ProductVariant rows via QueryBuilder + `setLock`
> - Order sequence uses `pessimistic_write` lock on last order row
> - `OrdersModule` imports `ShippingModule` and `ProductsModule` (needs their repositories via `InjectDataSource`)

---

## Phase 8 — Wiring

### 8.1 AppModule registration
> `src/app.module.ts`

- [x] Import `StorageModule`
- [x] Import `CollectionsModule`
- [x] Import `CategoriesModule`
- [x] Import `ProductsModule`
- [x] Import `ReviewsModule`
- [x] Import `ShippingModule`
- [x] Import `AddressesModule`
- [x] Import `OrdersModule`

### 8.2 Guest → User linking in UsersService
> `src/users/users.service.ts`

- [x] After `User` is created (local register), in same transaction:
  - [x] `UPDATE Order SET userId = newUser.id, email = NULL WHERE email = newUser.email`
  - [x] `UPDATE Review SET userId = newUser.id WHERE email = newUser.email AND userId IS NULL`

---

## Phase 9 — Verification

- [ ] `pnpm run lint` — passes with no TS errors
- [ ] `pnpm run start:dev` — server starts, all tables auto-created
- [ ] DB schema check — `SavedAddress` has `shipping_first_name`, `billing_first_name` columns
- [ ] DB schema check — `Order` has `shipping_first_name`, `billing_first_name` columns
- [ ] DB schema check — `sub_category` has unique constraint on `(slug, category_id)`
- [ ] DB schema check — `product_variant.sku` has unique constraint
- [ ] E2E: `POST /auth/register` with email matching guest order → `Order.userId` set, `email` null
- [ ] E2E: `GET /products/:name` returns `rating` field (AVG of APPROVED reviews)
- [ ] E2E: `POST /products/:id/photos` (multipart) → file in `./uploads/`, URL accessible via HTTP
