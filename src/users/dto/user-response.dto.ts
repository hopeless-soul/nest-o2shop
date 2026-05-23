import { Expose } from 'class-transformer';
import { Role } from '../enums/role.enum';

export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() displayName?: string;
  @Expose() avatarUrl?: string;
  @Expose() googleLinked: boolean;
  @Expose() role: Role;
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;
}

export class AdminUserResponseDto extends UserResponseDto {
  @Expose() tokenVersion: number;
  @Expose() deletedAt: Date | null;
  @Expose() updatedAt: Date;
  @Expose() version: number;
}
