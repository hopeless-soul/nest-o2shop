import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export function PaginatedDto<TItem>(TItemClass: new () => TItem) {
  abstract class PaginatedDtoClass extends PaginatedResponseDto<TItem> {
    @ApiProperty({ type: () => TItemClass, isArray: true })
    declare data: TItem[];
  }
  Object.defineProperty(PaginatedDtoClass, 'name', {
    value: `Paginated${TItemClass.name}`,
  });
  return PaginatedDtoClass;
}
