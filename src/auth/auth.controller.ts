import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Response } from 'express';
import { CurrentUserData } from './types';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
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
