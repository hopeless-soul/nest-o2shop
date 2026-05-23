import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  address1: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  city: string;

  @ApiProperty({
    example: 'US',
    description: 'ISO 3166-1 alpha-2 country code',
  })
  @IsString()
  country: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  province: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: '+1 555 000 0000' })
  @IsString()
  phone: string;
}
