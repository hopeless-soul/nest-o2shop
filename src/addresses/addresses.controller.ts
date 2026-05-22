import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateSavedAddressDto } from './dto/create-saved-address.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@Auth(AuthType.Bearer)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.addressesService.findAllForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateSavedAddressDto,
  ) {
    return this.addressesService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateSavedAddressDto,
  ) {
    return this.addressesService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.addressesService.remove(id, user.id);
  }
}
