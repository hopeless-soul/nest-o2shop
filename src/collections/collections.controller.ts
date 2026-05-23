import { Controller, Get, Param, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CollectionsService } from './collections.service';
import { CollectionResponseDto } from './dto/collection-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Auth(AuthType.None)
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CollectionResponseDto>> {
    const result = await this.collectionsService.findAll(query, false);
    return {
      data: result.data.map((c) =>
        plainToInstance(CollectionResponseDto, c, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Auth(AuthType.None)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CollectionResponseDto> {
    const collection = await this.collectionsService.findById(id);
    return plainToInstance(CollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }
}
