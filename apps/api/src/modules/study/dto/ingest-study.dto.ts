import { IsString, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestStudyDto {
  @ApiProperty() @IsString() studyInstanceUid: string;
  @ApiPropertyOptional() @IsOptional() @IsString() patientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() patientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() patientBirthDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() patientSex?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accessionNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() studyDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() studyDescription?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() modalities?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() storagePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fileCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalSizeBytes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() institutionName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stationName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() modelName?: string;
}
