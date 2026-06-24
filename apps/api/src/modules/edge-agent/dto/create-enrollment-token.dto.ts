import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentTokenDto {
  @ApiProperty() @IsUUID() clinicId: string;
  @ApiProperty() @IsString() name: string;
}
