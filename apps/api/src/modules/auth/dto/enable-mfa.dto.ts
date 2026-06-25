import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class EnableMfaDto {
  @ApiProperty({ description: 'TOTP 6-digit code from authenticator app', example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}
