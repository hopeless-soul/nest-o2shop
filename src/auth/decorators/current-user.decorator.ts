import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload, CurrentUserData } from '../types';

/**
 * Parameter decorator that extracts the current authenticated user from the request.
 * Populated by Passport after a successful JWT strategy validation (req.user).
 *
 * Usage:
 *   @CurrentUser() user: CurrentUserData  → full user object
 *   @CurrentUser('email') email: string      → single field
 */
export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    // Switch context to HTTP and grab the underlying Express request object
    const request = ctx.switchToHttp().getRequest();

    // req.user is set by Passport after JwtStrategy.validate() runs successfully
    const user: CurrentUserData | undefined = request.user;

    // If a specific field was requested (e.g. @CurrentUser('email')),
    // return just that field. Otherwise return the full user object.
    // Optional chaining handles unauthenticated routes where user is undefined.
    return field ? user?.[field] : user;
  },
);
