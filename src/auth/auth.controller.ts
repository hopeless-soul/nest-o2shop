import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Response } from 'express'
import { CurrentUserData } from './types';

@Controller('auth')
export class AuthController {
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: { user: CurrentUserData }, @Res() res: Response) {
    console.log('googleCallback -->');
    console.log(req.user);
    // TODO: Generate tokens and send them to the user
    res.redirect('/');
    {
      msg: 'OK';
    }
  }
}
