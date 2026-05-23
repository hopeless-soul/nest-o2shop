import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: ['email must be an email'], type: [String] })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
