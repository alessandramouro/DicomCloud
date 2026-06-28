import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import agentConfig from './config/agent.config';
import dicomConfig from './config/dicom.config';
import syncConfig from './config/sync.config';
import { DatabaseModule } from './database/database.module';
import { CloudApiModule } from './modules/cloud-api/cloud-api.module';
import { DicomListenerModule } from './modules/dicom-listener/dicom-listener.module';
import { OrthancForwardModule } from './modules/orthanc-forward/orthanc-forward.module';
import { QueueModule } from './modules/queue/queue.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AgentStateModule } from './modules/state/agent-state.module';
import { SyncEngineModule } from './modules/sync-engine/sync-engine.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { WatchdogModule } from './modules/watchdog/watchdog.module';
import { WorklistModule } from './modules/worklist/worklist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [agentConfig, dicomConfig, syncConfig],
    }),

    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    ScheduleModule.forRoot(),

    // Local Redis optional — fall back to in-memory queue
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          lazyConnect: true,
        },
      }),
    }),

    DatabaseModule,
    AgentStateModule,
    CloudApiModule,
    DicomListenerModule,
    OrthancForwardModule,
    SyncEngineModule,
    WatchdogModule,
    QueueModule,
    TelemetryModule,
    RealtimeModule,
    WorklistModule,
  ],
})
export class AppModule {}
