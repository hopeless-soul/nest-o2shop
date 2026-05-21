import { Reflector } from '@nestjs/core';
import { AuthType } from '../enums/auth-type.enum';
import { GoogleAuthGuard } from './google-auth.guard';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AUTH_TYPE_KEY } from '../decorators/auth.decorator';
import { LocalAuthGuard } from './local-auth.guard';

/**
 * A general authentication guard for the app. AuthenticationGuard orchestrates authentication
 * policies for routes.
 *
 * It checks the route metadata set by the @Auth() decorator and then
 * delegates the actual authentication check to the right guard.
 *
 * The main idea is that routes can say what kind of authentication they
 * need, and this guard will run the correct logic for that mode.
 *
 * *Default AuthType is AuthType.Bearer*
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  /**
   * A map from AuthType values to the guard(s) that should run for that type.
   *
   * For example, AuthType.Bearer uses JwtAuthGuard, while AuthType.None
   * uses a simple guard that always returns true.
   *
   * The guard supposed to be applied globally. To make publick endpoints @Auth(AuthType.None)
   * should be used on controller or route level.
   */
  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;

  constructor(
    private reflector: Reflector,
    private localAuthGuard: LocalAuthGuard,
    private jwtAuthGuard: JwtAuthGuard,
    private googleAuthGuard: GoogleAuthGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Local]: this.localAuthGuard,
      [AuthType.Bearer]: this.jwtAuthGuard,
      [AuthType.Google]: this.googleAuthGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

  /**
   * If a route does not use @Auth(), this guard assumes Bearer auth by default.
   */
  private static readonly defaultAuthType = AuthType.Bearer;

  /**
   * Runs authentication for the incoming request.
   *
   * - Reads auth metadata from the handler or controller class.
   * - If no metadata is found, it uses the default auth type.
   * - Finds the guard(s) for the selected auth type(s). (Resolves the matching guard(s) from authTypeGuardMap.)
   * - Runs each guard until one allows the request.
   * - If all guards fail, throws the last error it received.
   *
   * This is useful for learning because it shows how a single guard can
   * choose between different authentication strategies based on metadata.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuthType];

    const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();
    let error = new UnauthorizedException();

    for (const instance of guards) {
      const canActivate = await Promise.resolve(
        instance.canActivate(context),
      ).catch((err) => {
        error = err;
      });
      if (canActivate) {
        return true;
      }
    }

    throw error;
  }
}
