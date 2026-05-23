import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { AddressesModule } from '../addresses/addresses.module';

@Module({
  imports: [UsersModule, OrdersModule, AddressesModule],
  controllers: [MeController],
})
export class MeModule {}
