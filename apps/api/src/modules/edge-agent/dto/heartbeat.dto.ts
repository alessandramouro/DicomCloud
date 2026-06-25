import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export class HeartbeatDto {
  @ApiProperty({ enum: ['ONLINE','OFFLINE','DEGRADED','MAINTENANCE'] })
  @IsEnum(['ONLINE','OFFLINE','DEGRADED','MAINTENANCE'])
  status: string;

  @ApiProperty()
  @IsObject()
  metrics: {
    cpuUsagePercent: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    diskUsedGB: number;
    diskTotalGB: number;
    networkTxBytesPerSec: number;
    networkRxBytesPerSec: number;
  };

  @ApiProperty()
  @IsObject()
  queueStats: {
    pending: number;
    processing: number;
    failed: number;
    completed: number;
    totalSize: number;
  };

  @ApiPropertyOptional() @IsOptional() @IsString() ipAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() version?: string;
}
