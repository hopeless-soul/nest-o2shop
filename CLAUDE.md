# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm run start:dev        # Watch mode (port 3001)
pnpm run start:debug      # With Node inspector

# Build & Production
pnpm run build
pnpm run start:prod

# Tests
pnpm run test             # Unit tests (*.spec.ts)
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e         # Uses test/jest-e2e.json

# Code quality
pnpm run lint             # ESLint with auto-fix
pnpm run format           # Prettier

# Docker (includes PostgreSQL)
docker-compose up
```

## Architecture

```
AppModule
  ├── ConfigModule (global, loads .env)
  ├── DatabaseModule (TypeORM + PostgreSQL)
  └── AuthModule
        ├── UsersModule
        ├── HashingModule
        └── JwtModule
```

**Server runs on port 3001.**

## Authentication System

Three auth strategies co-exist via a metadata-driven guard hierarchy:

- `AuthenticationGuard` — applied globally, reads `@Auth()` decorator metadata, delegates to the matching Passport guard
- `@Auth(AuthType.Bearer | Local | Google | None)` — controls which strategy protects a route
- `AuthType.None` — marks public endpoints (no auth check)

**Strategies:**
| Strategy | Flow |
|----------|------|
| **Google OAuth 2.0** | `GET /auth/google/login` → callback `/auth/google/redirect` → create/find user → issue tokens |
| **Local** | `POST /auth/login` (email+password) / `POST /auth/register` |
| **JWT Bearer** | Reads from cookie `access_token` or `Authorization: Bearer` header |

**Token lifecycle:**
- Access token (1h): embeds `sub`, `email`, `tokenVersion`
- Refresh token (24h): embeds `refresh_token_id`
- `tokenVersion` on the User entity enables mass-invalidation (increment to invalidate all tokens)
- Tokens are set as HttpOnly, Secure (prod), SameSite=Lax cookies

## User Entity & Database

TypeORM + PostgreSQL. Key User fields:
- `id`: UUID PK
- `password`: `select: false` — must be explicitly selected in queries when needed
- `tokenVersion`: increment to invalidate all issued tokens
- `googleLinked`: true if Google OAuth is connected
- `deletedAt`: soft delete enabled
- `version`: optimistic locking via `@VersionColumn()`

`synchronize: true` is active — schema auto-syncs in dev. **Do not enable in production.**

## Hashing Abstraction

`HashingService` (abstract) → `BcryptService` (10 salt rounds). Swap implementations by replacing the provider in `HashingModule` without touching callers.

## Known TODOs in Code

- `AuthService` (~line 24): refresh token rotation not implemented
- `UsersService.saveRefreshToken()` (~line 180): refresh token persistence stubbed

## Environment Variables

```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
JWT_SECRET, JWT_REFRESH_SECRET
JWT_ACCESS_TOKEN_TTL=3600
JWT_REFRESH_TOKEN_TTL=86400
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/redirect
```
