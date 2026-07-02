import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

export class BulkExportDto {
  @ApiProperty({ type: [String], description: 'Study IDs to export, all to the same destination' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  studyIds: string[];

  @ApiProperty()
  @IsString()
  destinationId: string;
}
