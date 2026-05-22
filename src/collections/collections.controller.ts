import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Auth(AuthType.None)
  @Get()
  findAll() {
    return this.collectionsService.findAll();
  }

  @Auth(AuthType.None)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
