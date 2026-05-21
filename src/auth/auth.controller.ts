import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Request, Response } from 'express';
import type { CurrentUserData, Tokens } from './types';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { CreateLocalUserDto } from '../users/dto/create-local-user.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  @Get('google/login')
  @Auth(AuthType.Google)
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @Get('google/redirect')
  @Auth(AuthType.Google)
  async googleCallback(
    @Req() request: { user: CurrentUserData },
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('googleCallback -->');
    console.log(request.user);

    const tokens = await this.authService.issueTokens(request.user);
    this.setTokenCookies(response, tokens);

    // response.cookie('access_token', tokens.access_token, { httpOnly: true });
    // response.cookie('refresh_token', tokens.refresh_token, { httpOnly: true });

    response.redirect('/');
  }

  @Post('login')
  @Auth(AuthType.Local)
  @HttpCode(HttpStatus.OK)
  async localLogin(
    @CurrentUser() user: CurrentUserData,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('localLogin -->');
    console.log(request.user);
    console.log(user);
    const tokens = await this.authService.issueTokens(user);
    this.setTokenCookies(response, tokens);
    return tokens;
  }

  @Post('register')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.CREATED)
  localRegister(@Body() dto: CreateLocalUserDto) {
    return this.usersService.createFromLocal(dto);
  }

  // Helpers
  private setTokenCookies(response: Response, tokens: Tokens): void {
    const now = new Date();

    response.cookie('access_token', tokens.access_token, {
      httpOnly: true, // prevents JavaScript access to the cookie
      secure: this.configService.get('NODE_ENV') === 'production', // set to true in production (requires HTTPS)
      sameSite: 'lax', // restricts cookie to same site (CSRF protection)
      expires: new Date(
        now.getTime() +
          parseInt(this.configService.getOrThrow('JWT_ACCESS_TOKEN_TTL')) *
            1000,
      ),
    });

    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true, // prevents JavaScript access to the cookie
      // secure: true, // set to true in production (requires HTTPS)
      // sameSite: true, // restricts cookie to same site (CSRF protection)
      // path: '/refresh', // only sent to the refresh endpoint
      expires: new Date(
        now.getTime() +
          parseInt(this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL')) *
            1000,
      ),
    });
  }
}
