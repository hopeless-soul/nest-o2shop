import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (config: ConfigService): JwtModuleOptions => ({
  secret: config.get<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: parseInt(config.getOrThrow('JWT_ACCESS_TOKEN_TTL')),
  },
});
