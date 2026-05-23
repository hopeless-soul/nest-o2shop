import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateSavedAddressDto } from './dto/create-saved-address.dto';
import { SavedAddressResponseDto } from './dto/saved-address-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { CurrentUserData } from '../auth/types';

@ApiTags('Addresses')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Auth(AuthType.Bearer)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOperation({ summary: 'List saved addresses for the authenticated user' })
  @ApiOkResponse({ type: SavedAddressResponseDto, isArray: true })
  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.addressesService.findAllForUser(user.id);
  }

  @ApiOperation({ summary: 'Save a new address' })
  @ApiBody({ type: CreateSavedAddressDto })
  @ApiCreatedResponse({ type: SavedAddressResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateSavedAddressDto,
  ) {
    return this.addressesService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Update a saved address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiBody({ type: CreateSavedAddressDto })
  @ApiOkResponse({ type: SavedAddressResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Address not found or not owned by current user' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateSavedAddressDto,
  ) {
    return this.addressesService.update(id, user.id, dto);
  }

  @ApiOperation({ summary: 'Delete a saved address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiNoContentResponse({ description: 'Address deleted' })
  @ApiNotFoundResponse({ description: 'Address not found or not owned by current user' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.addressesService.remove(id, user.id);
  }
}
