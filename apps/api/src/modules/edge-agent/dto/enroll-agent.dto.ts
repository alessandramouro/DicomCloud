import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class EnrollAgentDto {
  @ApiProperty() @IsString() token: string;
  @ApiProperty() @IsString() version: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hostname?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() platform?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() osVersion?: string;
  @ApiProperty() @IsObject() dicomConfig: {
    aeTitle: string;
    port: number;
    allowedCallingAeTitles: string[];
    receiveDirectory: string;
    processedDirectory: string;
    failedDirectory: string;
  };
}
