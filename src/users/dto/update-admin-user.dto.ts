import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../enums/role.enum';

export class UpdateAdminUserDto {
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() resetTokenVersion?: boolean;
}
