import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocalUserDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
