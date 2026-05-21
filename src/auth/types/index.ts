// ─── Base ─────────────────────────────────────────────────────────────────────

/** Minimal user identity — shared base for anything that refers to a known user */
interface UserData {
  id: string;
  email: string;
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
  // email is mentioned because AccessTokenPayload is not extends UserData anymore
  email: string;
  tokenVersion: number; // invalidates all tokens on logout / password change
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
 * Maps a decoded access token payload back to CurrentUserData.
 * Used in JwtStrategy.validate() to populate req.user from JWT claims.
 */
export const toCurrentUserData = (payload: AccessTokenPayload): CurrentUserData => ({
  id: payload.sub,
  email: payload.email,
});