import { IsString, IsOptional, IsUUID, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertStorageDestinationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() id?: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['GOOGLE_DRIVE','ONEDRIVE','SMB','NFS','S3','LOCAL'] })
  @IsEnum(['GOOGLE_DRIVE','ONEDRIVE','SMB','NFS','S3','LOCAL'])
  type: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty() @IsObject() config: Record<string, unknown>;
}
