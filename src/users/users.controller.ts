import { Controller } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle({ auth: true })
@Controller('users')
export class UsersController {}
