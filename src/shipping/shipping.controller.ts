import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('shipping-methods')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Auth(AuthType.None)
  @Get()
  findAll(@Query('all') all?: string) {
    return this.shippingService.findAll(all !== 'true');
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateShippingMethodDto) {
    return this.shippingService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }
}
