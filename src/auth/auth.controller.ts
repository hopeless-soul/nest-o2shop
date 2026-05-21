import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Response } from 'express';
import { CurrentUserData } from './types';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google/login')
  @Auth(AuthType.Google)
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @Get('google/redirect')
  @Auth(AuthType.Google)
  async googleCallback(
    @Req() req: { user: CurrentUserData },
    @Res() res: Response,
  ) {
    console.log('googleCallback -->');
    console.log(req.user);

    const tokens = await this.authService.issueTokens(req.user);

    res.cookie('access_token', tokens.access_token, { httpOnly: true });
    res.cookie('refresh_toen', tokens.refresh_token, { httpOnly: true });

    res.redirect('/');
    {
      msg: 'OK';
    }
  }
}
