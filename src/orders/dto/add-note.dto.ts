import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNoteDto {
  @ApiProperty({ example: 'Called customer to confirm address.', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  note: string;
}
