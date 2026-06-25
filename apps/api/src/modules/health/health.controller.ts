import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Public } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    const dbOk = await this.prisma.healthCheck();
    const status = dbOk ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: { status: dbOk ? 'ok' : 'down' },
        api: { status: 'ok' },
      },
    };
  }
}
