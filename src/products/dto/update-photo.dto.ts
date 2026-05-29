import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePhotoDto {
  @ApiPropertyOptional({ example: 'Front view of product' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
