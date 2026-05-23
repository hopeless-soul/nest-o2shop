import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

export class UserResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @Expose()
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({ example: false })
  @Expose()
  googleLinked: boolean;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.REGULAR })
  @Expose()
  role: Role;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;
}

export class AdminUserResponseDto extends UserResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  tokenVersion: number;

  @ApiPropertyOptional({ nullable: true, example: null })
  @Expose()
  deletedAt: Date | null;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ example: 1 })
  @Expose()
  version: number;
}
