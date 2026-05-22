import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingMethod } from './entities/shipping-method.entity';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingMethod])],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
