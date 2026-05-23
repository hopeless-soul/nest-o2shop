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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AdminCollectionResponseDto } from './dto/collection-response.dto';
import { PaginatedResponseDto, PaginatedDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('Admin – Collections')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/collections')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminCollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @ApiOperation({ summary: 'List all collections (including inactive)' })
  @ApiOkResponse({ type: PaginatedDto(AdminCollectionResponseDto) })
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

  @ApiOperation({ summary: 'Get a collection by ID' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiOkResponse({ type: AdminCollectionResponseDto })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AdminCollectionResponseDto> {
    const collection = await this.collectionsService.findById(id);
    return plainToInstance(AdminCollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Create a collection' })
  @ApiBody({ type: CreateCollectionDto })
  @ApiCreatedResponse({ type: AdminCollectionResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Post()
  async create(
    @Body() dto: CreateCollectionDto,
  ): Promise<AdminCollectionResponseDto> {
    const collection = await this.collectionsService.create(dto);
    return plainToInstance(AdminCollectionResponseDto, collection, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update a collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiBody({ type: UpdateCollectionDto })
  @ApiOkResponse({ type: AdminCollectionResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Collection not found' })
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

  @ApiOperation({ summary: 'Delete a collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiNoContentResponse({ description: 'Collection deleted' })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.collectionsService.remove(id);
  }
}
