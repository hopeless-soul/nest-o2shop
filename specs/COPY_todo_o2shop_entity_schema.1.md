# O2Shop Entity Schema — Implementation Tracker

> Reference spec: [plan_o2shop_entity_schema_enhanced.md](./plan_o2shop_entity_schema_enhanced.md)
> Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Prerequisites

- [ ] Invoke `/nestjs-best-practices` skill before writing any code
- [ ] Confirm `pnpm run start:dev` starts cleanly on current codebase

---

## Phase 1 — Shared Infrastructure

### 1.1 Address Embedded Value Object
> `src/common/embeds/address.embed.ts`

- [ ] Create `Address` class (not `@Entity`)
  - [ ] `firstName`, `lastName` — `@Column()`
  - [ ] `company?` — `@Column({ nullable: true })`
  - [ ] `address1` — `@Column()`
  - [ ] `address2?` — `@Column({ nullable: true })`
  - [ ] `city`, `country`, `province`, `postalCode`, `phone` — `@Column()`

### 1.2 StorageModule
> `src/common/storage/`

- [ ] `storage.service.ts` — abstract class
  - [ ] `save(file: Express.Multer.File, subPath: string): Promise<string>`
  - [ ] `delete(fileUrl: string): Promise<void>`
  - [ ] `getUrl(subPath: string): string`
- [ ] `local-storage.service.ts` — concrete impl
  - [ ] Stores files in `./uploads/{subPath}`
  - [ ] Returns relative URL string
- [ ] `storage.module.ts`
  - [ ] `@Global()` decorator
  - [ ] Provides `StorageService` via `LocalStorageService`
  - [ ] Exports `StorageService`
- [ ] `main.ts` — add static file middleware for `./uploads`

---

## Phase 2 — Catalogue Structure

### 2.1 Collection
> `src/collections/`

- [ ] `entities/collection.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `slug` — unique varchar (kebab-case)
  - [ ] `displayName` — varchar
  - [ ] `description` — text nullable
  - [ ] `bannerImageUrl` — varchar nullable
  - [ ] `isActive` — boolean DEFAULT true
  - [ ] `products` — OneToMany → Product
  - [ ] `createdAt`, `updatedAt` — timestamps
- [ ] `collections.module.ts` — `TypeOrmModule.forFeature([Collection])`
- [ ] `collections.service.ts` — CRUD methods
- [ ] `collections.controller.ts`
  - [ ] `GET /collections` — `@Auth(AuthType.None)`
  - [ ] `GET /collections/:id` — `@Auth(AuthType.None)`
  - [ ] `POST /collections` — admin only
  - [ ] `PATCH /collections/:id` — admin only
  - [ ] `DELETE /collections/:id` — admin only
- [ ] `dto/create-collection.dto.ts`
- [ ] `dto/update-collection.dto.ts`

### 2.2 Category + SubCategory
> `src/categories/`

- [ ] `entities/category.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `slug` — unique varchar
  - [ ] `displayName` — varchar
  - [ ] `subCategories` — OneToMany → SubCategory
  - [ ] `createdAt`, `updatedAt`
- [ ] `entities/subcategory.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `slug` — varchar
  - [ ] `displayName` — varchar
  - [ ] `category` — ManyToOne → Category
  - [ ] `products` — OneToMany → Product
  - [ ] `createdAt`, `updatedAt`
  - [ ] `@Unique(['slug', 'categoryId'])` — slug unique per category
- [ ] `categories.module.ts` — `TypeOrmModule.forFeature([Category, SubCategory])`
- [ ] `categories.service.ts` — CRUD for both Category and SubCategory
- [ ] `categories.controller.ts`
  - [ ] `GET /categories` — `@Auth(AuthType.None)`
  - [ ] `GET /categories/:id` — `@Auth(AuthType.None)`
  - [ ] `POST /categories` — admin only
  - [ ] `PATCH /categories/:id` — admin only
  - [ ] `DELETE /categories/:id` — admin only
  - [ ] `GET /categories/:id/subcategories` — `@Auth(AuthType.None)`
  - [ ] `POST /categories/:id/subcategories` — admin only
  - [ ] `PATCH /categories/:id/subcategories/:subId` — admin only
  - [ ] `DELETE /categories/:id/subcategories/:subId` — admin only
- [ ] `dto/create-category.dto.ts`
- [ ] `dto/create-subcategory.dto.ts`

---

## Phase 3 — Products

### 3.1 ProductPhoto entity (no module — part of ProductsModule)
> `src/products/entities/product-photo.entity.ts`

- [ ] `id` — uuid PK
- [ ] `product` — ManyToOne → Product `onDelete: CASCADE`
- [ ] `url` — varchar (path from StorageService)
- [ ] `altText` — varchar nullable
- [ ] `sortOrder` — int DEFAULT 0
- [ ] `createdAt` — `@CreateDateColumn()`

### 3.2 Product entity (initial — defaultVariantId nullable, no @JoinColumn yet)
> `src/products/entities/product.entity.ts`

- [ ] `id` — uuid PK
- [ ] `name` — unique varchar (URL slug, underscores)
- [ ] `displayName` — varchar
- [ ] `collection` — ManyToOne → Collection nullable `onDelete: SET NULL`
- [ ] `collectionId` — varchar nullable
- [ ] `category` — ManyToOne → Category `onDelete: RESTRICT`
- [ ] `categoryId` — varchar
- [ ] `subCategory` — ManyToOne → SubCategory `onDelete: RESTRICT`
- [ ] `subCategoryId` — varchar
- [ ] `basePrice` — decimal(10,2)
- [ ] `currency` — char(3) ISO 4217
- [ ] `description` — jsonb `{ blocks: DescriptionBlock[] }`
- [ ] `isPublished` — boolean DEFAULT false
- [ ] `defaultVariantId` — varchar nullable (FK added after variants step)
- [ ] `photos` — OneToMany → ProductPhoto cascade
- [ ] `variants` — OneToMany → ProductVariant cascade
- [ ] `reviews` — OneToMany → Review
- [ ] `deletedAt` — `@DeleteDateColumn()`
- [ ] `createdAt`, `updatedAt`
- [ ] `types/description-block.type.ts` — `DescriptionBlock` union type

### 3.3 ProductVariant entity
> `src/products/entities/product-variant.entity.ts`

- [ ] `id` — uuid PK
- [ ] `product` — ManyToOne → Product `onDelete: CASCADE`
- [ ] `productId` — varchar
- [ ] `colorName` — varchar
- [ ] `colorValue` — varchar (e.g. `#FF0000`)
- [ ] `size` — varchar (free-form)
- [ ] `sku` — unique varchar (auto-generated, admin-overridable)
- [ ] `stock` — int DEFAULT 0
- [ ] `priceOverride` — decimal(10,2) nullable
- [ ] `mainPhotoId` — varchar nullable
- [ ] `mainPhoto` — ManyToOne → ProductPhoto nullable `onDelete: SET NULL`
- [ ] `createdAt`, `updatedAt`
- [ ] `generateSku()` helper in `products.service.ts`

### 3.4 Back-patch Product — add defaultVariant relation
> `src/products/entities/product.entity.ts`

- [ ] Add `defaultVariant` — `@OneToOne(() => ProductVariant, { nullable: true }) @JoinColumn({ name: 'defaultVariantId' })`

### 3.5 ProductsModule
> `src/products/`

- [ ] `products.module.ts` — `TypeOrmModule.forFeature([Product, ProductVariant, ProductPhoto])`
- [ ] `products.service.ts`
  - [ ] `findAll()` — paginated, filterable, hides unpublished from non-admins
  - [ ] `findByName(name)` — returns product + defaultVariant + computed rating
  - [ ] `findByNameAndVariant(name, sku)` — returns specific variant
  - [ ] `create()` — admin
  - [ ] `update()` — admin
  - [ ] `softDelete()` — admin
  - [ ] `createVariant()` — generates SKU, admin
  - [ ] `updateVariant()` — admin
  - [ ] `addPhoto()` — calls StorageService, admin
  - [ ] `deletePhoto()` — calls StorageService, admin
  - [ ] `setDefaultVariant()` — admin
  - [ ] `computeRating(productId)` — `AVG` over APPROVED reviews
- [ ] `products.controller.ts`
  - [ ] `GET /products` — `@Auth(AuthType.None)`
  - [ ] `GET /products/:name` — `@Auth(AuthType.None)`
  - [ ] `POST /products` — admin only
  - [ ] `PATCH /products/:id` — admin only
  - [ ] `DELETE /products/:id` — admin only
  - [ ] `POST /products/:id/variants` — admin only
  - [ ] `PATCH /products/:id/variants/:variantId` — admin only
  - [ ] `POST /products/:id/photos` — admin only (multipart/form-data)
  - [ ] `DELETE /products/:id/photos/:photoId` — admin only
- [ ] `dto/create-product.dto.ts`
- [ ] `dto/update-product.dto.ts`
- [ ] `dto/create-variant.dto.ts`
- [ ] `dto/update-variant.dto.ts`

---

## Phase 4 — Reviews

### 4.1 Review entity + module
> `src/reviews/`

- [ ] `enums/review-status.enum.ts` — `PENDING | APPROVED | REJECTED`
- [ ] `entities/review.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `product` — ManyToOne → Product `onDelete: CASCADE`
  - [ ] `productId` — varchar
  - [ ] `user` — ManyToOne → User nullable `onDelete: SET NULL`
  - [ ] `userId` — varchar nullable
  - [ ] `email` — varchar (always stored)
  - [ ] `displayName` — varchar
  - [ ] `rating` — int (1–10)
  - [ ] `content` — text
  - [ ] `status` — enum ReviewStatus DEFAULT PENDING
  - [ ] `photoUrls` — simple-array nullable
  - [ ] `createdAt`, `updatedAt`
- [ ] `reviews.module.ts` — `TypeOrmModule.forFeature([Review])`
- [ ] `reviews.service.ts`
  - [ ] `create()` — sets userId if request has authenticated user, else email only
  - [ ] `delete()` — admin OR review owner check
  - [ ] `updateStatus()` — admin only
- [ ] `reviews.controller.ts`
  - [ ] `POST /products/:productId/reviews` — `@Auth(AuthType.None)`
  - [ ] `DELETE /reviews/:id` — `@Auth(AuthType.Bearer)`
  - [ ] `PATCH /reviews/:id/status` — admin only
- [ ] `dto/create-review.dto.ts`

---

## Phase 5 — Shipping

### 5.1 ShippingMethod entity + module
> `src/shipping/`

- [ ] `entities/shipping-method.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `name` — varchar
  - [ ] `price` — decimal(10,2)
  - [ ] `currency` — char(3)
  - [ ] `estimatedDays` — int nullable
  - [ ] `isActive` — boolean DEFAULT true
  - [ ] `createdAt`, `updatedAt`
- [ ] `shipping.module.ts` — `TypeOrmModule.forFeature([ShippingMethod])`
- [ ] `shipping.service.ts` — CRUD
- [ ] `shipping.controller.ts`
  - [ ] `GET /shipping-methods` — `@Auth(AuthType.None)` (active only for public)
  - [ ] `POST /shipping-methods` — admin only
  - [ ] `PATCH /shipping-methods/:id` — admin only
  - [ ] `DELETE /shipping-methods/:id` — admin only
- [ ] `dto/create-shipping-method.dto.ts`

---

## Phase 6 — Addresses

### 6.1 SavedAddress entity + module
> `src/addresses/`

- [ ] `entities/saved-address.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `user` — ManyToOne → User `onDelete: CASCADE`
  - [ ] `name` — varchar (e.g. `My Home`)
  - [ ] `shippingAddress` — embedded Address `prefix: 'shipping'`
  - [ ] `billingAddress` — embedded Address `prefix: 'billing'`
  - [ ] `billingIsSameAsShipping` — boolean DEFAULT false
  - [ ] `createdAt`, `updatedAt`
- [ ] `addresses.module.ts` — `TypeOrmModule.forFeature([SavedAddress])`
- [ ] `addresses.service.ts` — CRUD scoped to current user
- [ ] `addresses.controller.ts` — all routes `@Auth(AuthType.Bearer)`
  - [ ] `GET /addresses` — current user's saved addresses
  - [ ] `POST /addresses`
  - [ ] `PATCH /addresses/:id`
  - [ ] `DELETE /addresses/:id`
- [ ] `dto/create-saved-address.dto.ts` — includes `AddressDto` nested ×2
- [ ] `dto/address.dto.ts` — reusable `AddressDto` (also used in `CreateOrderDto`)

---

## Phase 7 — Orders

### 7.1 Order + OrderItem entities + module
> `src/orders/`

- [ ] `enums/payment-status.enum.ts` — `PENDING | PAID | FAILED | REFUNDED`
- [ ] `enums/fulfillment-status.enum.ts` — `UNFULFILLED | FULFILLED | PARTIALLY_FULFILLED | CANCELLED`
- [ ] `entities/order.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `orderNumber` — unique varchar (`O2SHOP-000001`)
  - [ ] `orderSequence` — int (used to generate orderNumber in transaction)
  - [ ] `user` — ManyToOne → User nullable
  - [ ] `userId` — varchar nullable
  - [ ] `guestEmail` — varchar nullable
  - [ ] `guestFirstName` — varchar nullable
  - [ ] `guestLastName` — varchar nullable
  - [ ] `paymentStatus` — enum DEFAULT PENDING
  - [ ] `fulfillmentStatus` — enum DEFAULT UNFULFILLED
  - [ ] `totalAmount` — decimal(10,2)
  - [ ] `totalCurrency` — char(3)
  - [ ] `shippingMethod` — ManyToOne → ShippingMethod nullable
  - [ ] `shippingMethodName` — varchar (captured at purchase)
  - [ ] `shippingPrice` — decimal(10,2) (captured at purchase)
  - [ ] `shippingCurrency` — char(3) (captured at purchase)
  - [ ] `shippingAddress` — embedded Address `prefix: 'shipping'` (captured at purchase)
  - [ ] `billingAddress` — embedded Address `prefix: 'billing'` (captured at purchase)
  - [ ] `paymentProviderId` — varchar nullable
  - [ ] `paymentProviderRef` — varchar nullable
  - [ ] `items` — OneToMany → OrderItem cascade
  - [ ] `createdAt`, `updatedAt`
- [ ] `entities/order-item.entity.ts`
  - [ ] `id` — uuid PK
  - [ ] `order` — ManyToOne → Order `onDelete: CASCADE`
  - [ ] `product` — ManyToOne → Product nullable `onDelete: SET NULL`
  - [ ] `productId` — varchar nullable
  - [ ] `productName` — varchar (captured)
  - [ ] `productSku` — varchar (captured)
  - [ ] `productPrice` — decimal(10,2) (captured)
  - [ ] `productCurrency` — char(3) (captured)
  - [ ] `quantity` — int
  - [ ] `total` — decimal(10,2) (`price × qty`, computed before insert)
  - [ ] `createdAt`
- [ ] `orders.module.ts` — `TypeOrmModule.forFeature([Order, OrderItem])`
- [ ] `orders.service.ts`
  - [ ] `create()` — validates stock, pessimistic-lock order sequence, generates `O2SHOP-NNNNNN`, captures shipping snapshot
  - [ ] `findAll()` — admin only, paginated
  - [ ] `findMine(userId)` — current user's orders
  - [ ] `findByOrderNumber(orderNumber)` — public
  - [ ] `updateStatus()` — admin only
- [ ] `orders.controller.ts`
  - [ ] `POST /orders` — `@Auth(AuthType.None)`
  - [ ] `GET /orders` — admin only
  - [ ] `GET /orders/my` — `@Auth(AuthType.Bearer)`
  - [ ] `GET /orders/:orderNumber` — `@Auth(AuthType.None)`
  - [ ] `PATCH /orders/:id/status` — admin only
- [ ] `dto/create-order.dto.ts` — includes `AddressDto` ×2, line items array, shippingMethodId
- [ ] `dto/update-order-status.dto.ts`

---

## Phase 8 — Wiring

### 8.1 AppModule registration
> `src/app.module.ts`

- [ ] Import `CollectionsModule`
- [ ] Import `CategoriesModule`
- [ ] Import `ProductsModule`
- [ ] Import `ReviewsModule`
- [ ] Import `ShippingModule`
- [ ] Import `AddressesModule`
- [ ] Import `OrdersModule`

### 8.2 Guest → User linking in UsersService
> `src/users/users.service.ts`

- [ ] After `User` is created (local register + Google OAuth), in same transaction:
  - [ ] `UPDATE Order SET userId = newUser.id, guestEmail = NULL WHERE guestEmail = newUser.email`
  - [ ] `UPDATE Review SET userId = newUser.id WHERE email = newUser.email AND userId IS NULL`

---

## Phase 9 — Verification

- [ ] `pnpm run lint` — passes with no TS errors
- [ ] `pnpm run start:dev` — server starts, all tables auto-created
- [ ] DB schema check — `SavedAddress` has `shipping_first_name`, `billing_first_name` columns
- [ ] DB schema check — `Order` has `shipping_first_name`, `billing_first_name` columns
- [ ] DB schema check — `sub_category` has unique constraint on `(slug, category_id)`
- [ ] DB schema check — `product_variant.sku` has unique constraint
- [ ] E2E: `POST /auth/register` with email matching guest order → `Order.userId` set, `guestEmail` null
- [ ] E2E: `GET /products/:name` returns `rating` field (AVG of APPROVED reviews)
- [ ] E2E: `POST /products/:id/photos` (multipart) → file in `./uploads/`, URL accessible via HTTP
