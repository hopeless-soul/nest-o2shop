// ─── Base ─────────────────────────────────────────────────────────────────────

import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';

/** Minimal user identity — shared base for anything that refers to a known user */
interface UserData {
  id: string;
  email: string;
  role: Role;
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

/** Raw data extracted from the OAuth provider profile.
 *  No id yet — user may not exist in DB at this point */
export interface OAuthPayload {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  googleLinked: boolean;
}

// ─── Request user ─────────────────────────────────────────────────────────────

/** Attached to req.user by Passport after validate() resolves */
export interface CurrentUserData extends UserData {}

// ─── JWT payloads ─────────────────────────────────────────────────────────────

/** Claims encoded inside the access token */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  tokenVersion: number;
}

/** Claims encoded inside the refresh token.
 *  Email intentionally excluded — minimal surface area */
export interface RefreshTokenPayload {
  sub: string;
  refresh_token_id: string;
}

// ─── Token response shapes ────────────────────────────────────────────────────

export type AccessToken = {
  access_token: string;
};

export type RefreshToken = {
  refresh_token: string;
};

/** What AuthService.generateTokens() returns */
export type Tokens = AccessToken & RefreshToken;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalizes different user representations into CurrentUserData.
 *
 * Accepts either a decoded JWT access token payload (uses `sub` as id)
 * or a full User entity (uses `id` directly), and maps both to the
 * unified shape that Passport attaches to req.user.
 *
 * @param input - Decoded AccessTokenPayload or a User entity
 * @returns Normalized CurrentUserData for use as req.user
 */
export function toCurrentUserData(payload: AccessTokenPayload): CurrentUserData;
export function toCurrentUserData(user: User): CurrentUserData;
export function toCurrentUserData(
  input: AccessTokenPayload | User,
): CurrentUserData {
  if ('sub' in input) {
    return { id: input.sub, email: input.email, role: input.role };
  }
  return { id: input.id, email: input.email, role: input.role };
}
