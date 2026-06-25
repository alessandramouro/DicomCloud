import { Module } from '@nestjs/common';

import { CloudApiModule } from '../cloud-api/cloud-api.module';

import { TelemetryService } from './telemetry.service';

@Module({
  imports: [CloudApiModule],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
