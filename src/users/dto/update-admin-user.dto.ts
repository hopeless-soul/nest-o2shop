import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ enum: Role, enumName: 'Role', example: Role.REGULAR })
  @IsOptional() @IsEnum(Role) role?: Role;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Set to true to invalidate all existing tokens for this user',
    example: false,
  })
  @IsOptional() @IsBoolean() resetTokenVersion?: boolean;
}
