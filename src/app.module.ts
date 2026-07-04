import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './common/storage/storage.module';
import { CollectionsModule } from './collections/collections.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ShippingModule } from './shipping/shipping.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrdersModule } from './orders/orders.module';
import { MeModule } from './me/me.module';
import { ClsModule } from 'nestjs-cls';
import { AuditModule } from './audit/audit.module';
import { PaymentsModule } from './payments/payments.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Two named throttlers so different route categories can opt into one or the other.
    // "default" covers general endpoints;
    // "auth" is the stricter limit for login/register;
    // The ThrottlerGuard is registered globally in AuthModule alongside the other app guards.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: +config.getOrThrow('THROTTLE_DEFAULT_TTL'),
          limit: +config.getOrThrow('THROTTLE_DEFAULT_LIMIT'),
        },
        {
          name: 'auth',
          ttl: +config.getOrThrow('THROTTLE_AUTH_TTL'),
          limit: +config.getOrThrow('THROTTLE_AUTH_LIMIT'),
        },
      ],
    }),
    ClsModule.forRoot({ middleware: { mount: true } }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    CollectionsModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    ShippingModule,
    AddressesModule,
    OrdersModule,
    MeModule,
    AuditModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
