import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderPhotoItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderPhotosDto {
  @ApiProperty({ type: [ReorderPhotoItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderPhotoItemDto)
  photos: ReorderPhotoItemDto[];
}
