import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EdgeAgentModule } from '../edge-agent/edge-agent.module';

import { ExportGateway } from './export.gateway';

@Module({
  imports: [AuthModule, EdgeAgentModule],
  providers: [ExportGateway],
  exports: [ExportGateway],
})
export class RealtimeModule {}
