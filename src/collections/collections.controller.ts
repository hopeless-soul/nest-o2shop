import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CollectionsService } from './collections.service';
import { CollectionResponseDto } from './dto/collection-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @ApiOperation({ summary: 'List active collections' })
  @ApiOkResponse({ type: PaginatedDto(CollectionResponseDto) })
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

  @ApiOperation({ summary: 'Get a collection by ID' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiOkResponse({ type: CollectionResponseDto })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @Auth(AuthType.None)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CollectionResponseDto> {
    const collection = await this.collectionsService.findById(id);
    return plainToInstance(CollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }
}
