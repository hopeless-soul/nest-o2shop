import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConfig } from './jwt.config';
import { GoogleStrategy, JwtStrategy } from './strategies';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtConfig
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    GoogleAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
