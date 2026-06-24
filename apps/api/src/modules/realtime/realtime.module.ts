import { Module } from '@nestjs/common';
import { ExportGateway } from './export.gateway';
import { AuthModule } from '../auth/auth.module';
import { EdgeAgentModule } from '../edge-agent/edge-agent.module';

@Module({
  imports: [AuthModule, EdgeAgentModule],
  providers: [ExportGateway],
  exports: [ExportGateway],
})
export class RealtimeModule {}
