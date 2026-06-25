import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';

export class BulkExportDto {
  @ApiProperty({ type: [String], description: 'Study IDs to export, all to the same destination' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  studyIds: string[];

  @ApiProperty()
  @IsUUID()
  destinationId: string;
}
