import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CurrentUserData, OAuthPayload, Tokens } from './types';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateOAuthUser(data: OAuthPayload): Promise<CurrentUserData> {
    console.log('validateUser -->');
    console.log(data);

    let user = await this.usersService.findByEmail(data.email);
    if (user) return user;

    user = await this.usersService.createFromOAuth({
      email: data.email,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      googleLinked: true,
    });

    // Return user — passport attaches it to req.user
    return user;
  }

  generateTokens(user: CurrentUserData): Tokens {
    throw new Error('"generateTokens" is not implemented yet');
  }
}
