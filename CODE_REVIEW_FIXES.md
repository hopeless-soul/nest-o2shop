# Code Review Fixes

Summary of changes made following the NestJS code review.

---

## Critical Fixes (C-1, C-2)

### C-1 — Payment Intent endpoint had no authorization

**Problem:** `POST /payments/stripe/intent` was `@Auth(AuthType.None)`, meaning any caller could create a Stripe PaymentIntent on any `orderId` UUID with no ownership check.

**Fix:** Split into two endpoints:

| Endpoint | Auth | Ownership proof |
|----------|------|-----------------|
| `POST /payments/stripe/intent` | `@Auth(AuthType.Bearer)` | `order.userId === currentUser.id` |
| `POST /payments/stripe/guest-intent` | `@Auth(AuthType.None)` | `{ id: orderId, email, userId: IsNull() }` query match |

All negative cases on the guest endpoint (wrong email, linked order, bad UUID) return generic `404 Not Found` to prevent order ID enumeration.

**Files changed:**
- `src/payments/payments.controller.ts`
- `src/payments/payments.service.ts`
- `src/payments/dto/create-guest-intent.dto.ts` *(new)*

---

### C-2 — Guest checkout did not require email

**Problem:** `email` was `@IsOptional()` for all users, so a guest could place an order with `userId = NULL` and `email = NULL`, breaking the `linkGuestData()` flow that retroactively links guest orders on registration.

**Fix:** Added a service-level guard in `OrdersService.create()` before the transaction:

```ts
if (!currentUser && !dto.email) {
  throw new BadRequestException('email is required for guest checkout');
}
```

`CreateOrderDto.email` stays `@IsOptional()` — it is genuinely optional for authenticated users.

**Files changed:**
- `src/orders/orders.service.ts`

---

## Warning Fixes (W-2, W-4, W-8, W-10, W-11)

### W-2 — softDeleteAdmin used manual deletedAt assignment

**Problem:** `softDeleteAdmin` manually set `user.deletedAt = new Date()` and called `save()`, bypassing TypeORM's built-in soft-delete mechanism.

**Fix:** Replaced with TypeORM's `.softDelete(id)`. Existence check via `findByIdAdmin` (throws 404) is kept before the delete call.

```ts
async softDeleteAdmin(id: string): Promise<void> {
  await this.findByIdAdmin(id);
  await this.userRepository.softDelete(id);
}
```

**File changed:** `src/users/users.service.ts`

---

### W-4 — POST /admin/orders/:id/notes returned 201

**Problem:** Appending a note to an existing order used `@Post` (returns 201 Created), which is semantically wrong — no new resource is being created.

**Fix:** Changed to `@Patch` with `@HttpCode(200)`. Updated Swagger decorator from `@ApiCreatedResponse` to `@ApiOkResponse`.

**File changed:** `src/orders/admin-orders.controller.ts`

---

### W-8 — shippingMethodId used @IsString() instead of @IsUUID()

**Problem:** An invalid (non-UUID) value for `shippingMethodId` passed DTO validation and failed at the database layer with a 500 Internal Server Error instead of a clean 400.

**Fix:** Changed decorator to `@IsUUID()`.

**File changed:** `src/orders/dto/create-order.dto.ts`

---

### W-10 — photoUrls accepted any string

**Problem:** `@IsString({ each: true })` on `photoUrls` allowed any string value (e.g., `"not-a-url"`).

**Fix:** Changed to `@IsUrl({}, { each: true })`. The `simple-array` column type is unchanged (no migration needed — URLs with commas are invalid under `@IsUrl` anyway).

**File changed:** `src/reviews/dto/create-review.dto.ts`

---

### W-11 — Unused `Inject` import in GoogleStrategy

**Problem:** `Inject` was imported from `@nestjs/common` in `google.strategy.ts` but never used.

**Fix:** Removed the unused import.

**File changed:** `src/auth/strategies/google.strategy.ts`

---

## Dismissed / Accepted as Intentional

| # | Reason |
|---|--------|
| W-1 | Admin updating soft-deleted users is intentional |
| W-3 | Order sequence race condition accepted — fails safe with a unique constraint error (500), low probability in practice |
| W-5 | Stripe webhook returning `{ received: true }` on "order not found" is correct — retrying won't fix a permanently missing order |
| W-6 | `GET /me` DB lookup is necessary — JWT strategy only fetches `tokenVersion`, `role`, `isActive` for token validation, not the full profile |
| W-7 | Review `email` field is display-only; impersonation risk accepted |
| W-9 | `@IsObject()` on product `description` is acceptable for admin-only input |
