# NestJS Code Review — nest-o2shop

**Date:** 2026-05-23  
**Reviewer:** Claude Code  
**Overall Quality Score: 6.5 / 10**

Well-structured e-commerce API with thoughtful architecture decisions — metadata-driven guard hierarchy, pessimistic locking in order creation, clean DTO layering, and proper use of `excludeExtraneousValues` to prevent data leakage. Several security gaps and one production-breaking dependency bug must be fixed before shipping.

---

## Critical Issues (Must Fix)

### C1 — `@nestjs/jwt` is in `devDependencies`

**File:** `package.json`

`@nestjs/jwt` is declared under `devDependencies`. The `JwtModule` and `JwtService` are used at runtime to sign and verify tokens. A production build (`npm install --production`) will fail or silently skip JWT functionality.

**Fix:**
```json
"dependencies": {
  "@nestjs/jwt": "^11.0.2"
}
```

---

### C2 — `saveRefreshToken` is a no-op — refresh tokens cannot be revoked

**File:** `src/auth/auth.service.ts:178-182`

```typescript
private async saveRefreshToken(
  userId: string,
  refreshTokenId: string,
  refreshToken: string,
) {}  // empty body
```

The method is called, a UUID `rtId` is generated and embedded in the refresh token, but it is never persisted. Consequences:
- Refresh tokens are issued but cannot be validated, rotated, or revoked
- A stolen refresh token is valid forever (24h TTL, no server-side check)
- Logout cannot invalidate refresh tokens

**Fix:** Persist `sha256(refreshToken)` indexed by `userId`, validate on use, and delete on logout/rotation. Requires a `refresh_tokens` table or a `refreshTokenHash` column on `User`.

---

### C3 — Public order lookup leaks PII

**File:** `src/orders/orders.controller.ts:46-59`

```typescript
@Auth(AuthType.None)
@Get(':orderNumber')
async findByOrderNumber(@Param('orderNumber') orderNumber: string)
```

Anyone who knows an order number can retrieve the full order including `email`, `firstName`, `lastName`, and complete shipping/billing addresses. Order numbers are sequential (`O2SHOP-000001`, `O2SHOP-000002`) making enumeration trivial without rate limiting.

**Fix options:**
- Require the caller to also supply the associated email as a query param (common guest order lookup pattern)
- Or restrict to authenticated users only and expose via `/me/orders/:orderNumber`

---

### C4 — File upload has no size limit or MIME type validation

**File:** `src/products/admin-products.controller.ts:223`  
**File:** `src/products/products.service.ts:235`

```typescript
// Controller — no MulterOptions
@UseInterceptors(FileInterceptor('file'))
async addPhoto(@UploadedFile() file: Express.Multer.File, ...)

// Service — user-controlled filename used directly in path
const subPath = `products/${productId}/${Date.now()}-${file.originalname}`;
```

`file.originalname` is user-controlled. A filename like `../../config/.env` could escape the upload directory (path traversal). No file size cap or MIME type check enables disk exhaustion and malicious file uploads.

**Fix — controller:**
```typescript
import { extname } from 'path';

const imageFilter = (_req: any, file: Express.Multer.File, cb: Function) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
};

@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
}))
```

**Fix — service:**
```typescript
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ext = extname(file.originalname).toLowerCase();
const subPath = `products/${productId}/${randomUUID()}${ext}`;
```

---

### C5 — Deactivated users can still authenticate

**File:** `src/auth/strategies/jwt.strategy.ts:49-60`

```typescript
async validate(payload: AccessTokenPayload): Promise<CurrentUserData> {
  const user = await this.usersService.findById(payload.sub, {
    select: { tokenVersion: true, role: true },
    // ⚠️ isActive is never selected or checked
  });
  if (!user) throw new UnauthorizedException('Invalid token payload');
  if (user.tokenVersion !== payload.tokenVersion) throw new UnauthorizedException('Token is outdated');
  return { ...toCurrentUserData(payload), role: user.role };
}
```

The `User.isActive` field exists and `updateAdmin` can set it to `false`, but `JwtStrategy.validate()` never checks it. A banned user with a valid token retains full access for up to 1 hour.

**Fix:**
```typescript
const user = await this.usersService.findById(payload.sub, {
  select: { tokenVersion: true, role: true, isActive: true },
});
if (!user || !user.isActive) {
  throw new UnauthorizedException('Account is inactive');
}
```

---

## Warnings (Should Fix)

### W1 — `console.log` leaks OAuth PII in production

**File:** `src/auth/auth.service.ts:50-51`

```typescript
console.log('validateUser -->');
console.log(data);  // logs email, displayName, avatarUrl on every OAuth login
```

**Fix:** Remove entirely or replace with `new Logger(AuthService.name)` logging at debug level without the payload.

---

### W2 — Refresh token cookie missing `secure` and `sameSite`

**File:** `src/auth/auth.controller.ts:134-144`

The access token cookie correctly applies `secure` based on `NODE_ENV`, but the refresh token cookie has these options commented out. Since the refresh token has a longer TTL (24h), it is the higher-value credential.

**Fix:**
```typescript
response.cookie('refresh_token', tokens.refresh_token, {
  httpOnly: true,
  secure: this.configService.get('NODE_ENV') === 'production',
  sameSite: 'lax',
  path: '/auth/refresh', // scope to refresh endpoint once implemented
  expires: ...,
});
```

---

### W3 — `AuthController` calls `UsersService` directly instead of `AuthService`

**File:** `src/auth/auth.controller.ts:115-117`

```typescript
localRegister(@Body() dto: CreateLocalUserDto) {
  return this.usersService.createFromLocal(dto);  // bypasses AuthService
}
```

Registration logic belongs behind `AuthService.register()`. Move the call to keep the controller thin and business logic centralized.

---

### W4 — `Paginated<T>` interface duplicated across 4 service files

**Files:**
- `src/orders/orders.service.ts:18`
- `src/users/users.service.ts:16`
- `src/reviews/reviews.service.ts:17`
- `src/products/products.service.ts:23`

Identical `interface Paginated<T> { data: T[]; total: number; }` defined four times. Export once from `src/common/dto/paginated-response.dto.ts` and import from there.

---

### W5 — UUID route params lack `ParseUUIDPipe`

**Files:** `src/users/admin-users.controller.ts:71`, `src/products/admin-products.controller.ts:87`, and other UUID params throughout admin controllers.

A malformed UUID will hit the database and produce a cryptic PostgreSQL error instead of a clean `400 Bad Request`.

**Fix:**
```typescript
@Get(':id')
async findOne(@Param('id', ParseUUIDPipe) id: string) { ... }
```

---

### W6 — Unused imports in `AuthService`

**File:** `src/auth/auth.service.ts:14-16`

```typescript
import { InjectRepository } from '@nestjs/typeorm';  // unused
import { User } from '../users/entities/user.entity';  // unused
import { Repository } from 'typeorm';  // unused
```

Leftover from an earlier implementation. Remove to reduce noise.

---

### W7 — Guards registered twice in the DI container

**File:** `src/auth/auth.module.ts:29-47`

`AuthenticationGuard` and `RolesGuard` appear as both plain providers and `APP_GUARD` providers, creating two DI instances each.

**Fix:** Remove the plain provider registrations — the `APP_GUARD` entries are sufficient:

```typescript
providers: [
  AuthService,
  GoogleStrategy, GoogleAuthGuard,
  JwtStrategy, JwtAuthGuard,
  LocalAuthGuard, LocalStrategy,
  { provide: APP_GUARD, useClass: AuthenticationGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
],
```

---

## Suggestions (Consider Improving)

### S1 — No rate limiting on auth or enumerable endpoints

`POST /auth/login`, `POST /auth/register`, and the public order lookup are unprotected against brute force and enumeration. Consider `@nestjs/throttler` applied globally with stricter TTL/limit overrides on auth routes.

### S2 — No security headers middleware

`main.ts` does not configure Helmet or equivalent headers. Add `@nestjs/helmet` or manually set `X-Content-Type-Options`, `X-Frame-Options`, and `Content-Security-Policy`.

### S3 — `totalAmount` excludes shipping cost

**File:** `src/orders/orders.service.ts:96-99`

`totalAmount` is the sum of line items only. Verify this is intentional — if the amount shown to the customer should include shipping, add `shippingPrice` here.

### S4 — Raw SQL in `linkGuestData`

**File:** `src/users/users.service.ts:67-76`

The parameterized queries are safe, but hardcoded table/column names diverge silently when entities change. QueryBuilder keeps schema references in sync with the ORM.

### S5 — Commented-out dead code

**Files:** `src/auth/auth.controller.ts:67-68`, `src/auth/auth.service.ts:165-166`

Commented-out cookie lines and `// audience:` / `// issuer:` stubs should be removed or converted to tracked TODOs.

---

## Positive Observations

- **Metadata-driven guard orchestration** — `AuthenticationGuard` + `authTypeGuardMap` + `@Auth()` is a clean, extensible multi-strategy pattern.
- **`tokenVersion` invalidation** — mass token invalidation on password change/logout is correctly wired.
- **Pessimistic locking in order creation** — `FOR UPDATE` lock on variants inside a transaction correctly prevents overselling under concurrency.
- **`plainToInstance` with `excludeExtraneousValues: true`** — used consistently across all controllers; no accidental field leakage in API responses.
- **Abstract `HashingService` and `StorageService`** — clean interfaces with swappable implementations; easy to migrate to Argon2 or S3.
- **Consistent pagination** — `PaginationQueryDto` + `PaginatedResponseDto` + `PaginatedDto()` factory for Swagger typing used uniformly.
- **Comprehensive Swagger annotations** — every endpoint has operation summary, typed responses, and error codes documented.
- **`sortBy` validated with `@IsIn`** — `FilterProductsQueryDto` validates the sort column against an allowlist, preventing column injection.
- **Soft delete + optimistic locking on `User`** — `DeleteDateColumn` and `VersionColumn` are in place.

---

## Priority Matrix

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Move `@nestjs/jwt` to dependencies | Critical | Low |
| 2 | Implement `saveRefreshToken` | Critical | High |
| 3 | Add `isActive` check in `JwtStrategy.validate()` | Critical | Low |
| 4 | Sanitize filename + add Multer limits/filter | Critical | Low |
| 5 | Restrict order lookup (require email or auth) | Critical | Medium |
| 6 | Apply `secure`/`sameSite` to refresh cookie | Warning | Low |
| 7 | Remove `console.log(data)` from OAuth flow | Warning | Low |
| 8 | Add `ParseUUIDPipe` to all UUID params | Warning | Low |
| 9 | Move registration call behind `AuthService` | Warning | Low |
| 10 | Deduplicate `Paginated<T>` into common module | Warning | Low |
| 11 | Remove duplicate guard registrations | Warning | Low |
| 12 | Add `@nestjs/throttler` to auth routes | Suggestion | Medium |
| 13 | Add Helmet security headers | Suggestion | Low |
