import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { FilterUsersQueryDto } from './dto/filter-users-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { AdminUserResponseDto } from './dto/user-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './enums/role.enum';

@ApiTags('Admin – Users')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/users')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user (admin)' })
  @ApiBody({ type: CreateAdminUserDto })
  @ApiCreatedResponse({ type: AdminUserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Validation error' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdminUserDto): Promise<AdminUserResponseDto> {
    const user = await this.usersService.createFromAdmin(dto);
    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'List all users with filters' })
  @ApiOkResponse({ type: PaginatedDto(AdminUserResponseDto) })
  @Get()
  async findAll(
    @Query() query: FilterUsersQueryDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>> {
    const result = await this.usersService.findAllAdmin(query);
    return {
      data: result.data.map((u) =>
        plainToInstance(AdminUserResponseDto, u, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @ApiOperation({ summary: 'Get a user by ID (admin view)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ type: AdminUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.usersService.findByIdAdmin(id);
    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Update a user (role, isActive, token invalidation)',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateAdminUserDto })
  @ApiOkResponse({ type: AdminUserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.usersService.updateAdmin(id, dto);
    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.softDeleteAdmin(id);
  }
}
