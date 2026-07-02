import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class AgentQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicId?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['ONLINE','OFFLINE','DEGRADED','MAINTENANCE']) status?: string;
}
