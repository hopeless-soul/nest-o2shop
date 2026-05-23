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
  Query,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AdminCollectionResponseDto } from './dto/collection-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('admin/collections')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminCollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminCollectionResponseDto>> {
    const result = await this.collectionsService.findAll(query, true);
    return {
      data: result.data.map((c) =>
        plainToInstance(AdminCollectionResponseDto, c, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AdminCollectionResponseDto> {
    const collection = await this.collectionsService.findById(id);
    return plainToInstance(AdminCollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  async create(
    @Body() dto: CreateCollectionDto,
  ): Promise<AdminCollectionResponseDto> {
    const collection = await this.collectionsService.create(dto);
    return plainToInstance(AdminCollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<AdminCollectionResponseDto> {
    const collection = await this.collectionsService.update(id, dto);
    return plainToInstance(AdminCollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.collectionsService.remove(id);
  }
}
