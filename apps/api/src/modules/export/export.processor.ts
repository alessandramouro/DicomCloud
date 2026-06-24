import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportService } from './export.service';
import { ExportGateway } from '../realtime/export.gateway';
import { StorageDestinationType, ExportCommandPayload } from '@dicomcloud/types';

const UNSUPPORTED_DESTINATIONS: StorageDestinationType[] = ['NFS', 'S3', 'LOCAL'];

@Processor('exports')
export class ExportProcessor {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: ExportService,
    private readonly exportGateway: ExportGateway,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Dispatches the export to the edge agent that owns the study and returns.
   * Actual transfer completion arrives later, asynchronously, via ExportGateway
   * (export:progress / export:result) — this handler never awaits the transfer itself.
   */
  @Process('process-export')
  async handleProcessExport(job: Job<{ jobId: string }>) {
    const exportJob = await this.prisma.exportJob.findUnique({
      where: { id: job.data.jobId },
      include: { study: { include: { clinic: true } }, destination: true },
    });

    if (!exportJob) {
      this.logger.warn(`Export job ${job.data.jobId} not found — skipping`);
      return;
    }

    if (UNSUPPORTED_DESTINATIONS.includes(exportJob.destination.type)) {
      await this.exportService.markUnsupported(exportJob.id, exportJob.destination.type);
      return;
    }

    if (!exportJob.study.edgeAgentId) {
      await this.exportService.markPermanentFailure(
        exportJob.id,
        'Estudo não está associado a nenhum agente de borda',
      );
      return;
    }

    const decryptedConfig = this.exportService.decryptDestinationConfig(
      exportJob.destination.config as Record<string, unknown>,
    );

    const anonymize =
      this.configService.get<boolean>('app.featureAnonymization', false) &&
      exportJob.study.clinic.anonymizeOnExport;

    const payload: ExportCommandPayload = {
      jobId: exportJob.id,
      tenantId: exportJob.tenantId,
      clinicId: exportJob.clinicId,
      studyId: exportJob.studyId,
      destinationPath: exportJob.destinationPath ?? undefined,
      anonymize,
      destination: { type: exportJob.destination.type, config: decryptedConfig },
    };

    const dispatched = this.exportGateway.dispatchExportCommand(exportJob.study.edgeAgentId, payload);

    if (!dispatched) {
      await this.exportService.logAgentOffline(exportJob.id);
      throw new Error('Edge agent offline');
    }

    await this.exportService.markDispatched(exportJob.id);
  }
}
