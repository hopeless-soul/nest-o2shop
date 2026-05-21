import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../enums/auth-type.enum';

/**
 * Metadata key used to set authentication modes on routes.
 *
 * Other code reads this key to decide which authentication guard(s) should
 * run for a given controller or handler.
 */
export const AUTH_TYPE_KEY = 'authType';

/**
 * A decorator that marks a route with the allowed authentication types.
 *
 * Example: @Auth(AuthType.Bearer) means this route should use bearer token auth.
 * The AuthenticationGuard reads this metadata and then runs the matching guard.
 */
export const Auth = (...AuthTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, AuthTypes);
