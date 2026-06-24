import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CloudApiModule } from '../cloud-api/cloud-api.module';

@Module({
  imports: [CloudApiModule],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
