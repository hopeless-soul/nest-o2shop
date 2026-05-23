import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { FilterUsersQueryDto } from './dto/filter-users-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { AdminUserResponseDto } from './dto/user-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './enums/role.enum';

@Controller('admin/users')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AdminUserResponseDto> {
    const user = await this.usersService.findByIdAdmin(id);
    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.usersService.updateAdmin(id, dto);
    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.softDeleteAdmin(id);
  }
}
