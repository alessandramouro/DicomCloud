import { Test } from '@nestjs/testing';
import { ExportProcessor } from './export.processor';
import { ExportService } from './export.service';
import { ExportGateway } from '../realtime/export.gateway';
import { PrismaService } from '../../prisma/prisma.service';

describe('ExportProcessor', () => {
  let processor: ExportProcessor;
  let prisma: { exportJob: { findUnique: jest.Mock } };
  let exportService: Partial<Record<keyof ExportService, jest.Mock>>;
  let exportGateway: Partial<Record<keyof ExportGateway, jest.Mock>>;

  function buildExportJob(dicomAnonymizationFeature: boolean, clinicAnonymizeOnExport: boolean) {
    return {
      id: 'job-1',
      tenantId: 'tenant-1',
      clinicId: 'clinic-1',
      studyId: 'study-1',
      destinationPath: null,
      destination: { type: 'GOOGLE_DRIVE', config: { encrypted: true } },
      study: {
        edgeAgentId: 'agent-1',
        clinic: {
          anonymizeOnExport: clinicAnonymizeOnExport,
          tenant: { features: { dicomAnonymization: dicomAnonymizationFeature } },
        },
      },
    };
  }

  beforeEach(async () => {
    prisma = { exportJob: { findUnique: jest.fn() } };
    exportService = {
      decryptDestinationConfig: jest.fn().mockReturnValue({ decrypted: true }),
      markDispatched: jest.fn().mockResolvedValue(undefined),
      logAgentOffline: jest.fn().mockResolvedValue(undefined),
      markUnsupported: jest.fn().mockResolvedValue(undefined),
      markPermanentFailure: jest.fn().mockResolvedValue(undefined),
    };
    exportGateway = {
      dispatchExportCommand: jest.fn().mockReturnValue(true),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExportProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: ExportService, useValue: exportService },
        { provide: ExportGateway, useValue: exportGateway },
      ],
    }).compile();

    processor = moduleRef.get(ExportProcessor);
  });

  it.each`
    tenantFeature | clinicSetting | expectedAnonymize
    ${true}       | ${true}       | ${true}
    ${true}       | ${false}      | ${false}
    ${false}      | ${true}       | ${false}
    ${false}      | ${false}      | ${false}
  `(
    'sets anonymize=$expectedAnonymize when tenant feature is $tenantFeature and clinic setting is $clinicSetting',
    async ({ tenantFeature, clinicSetting, expectedAnonymize }) => {
      prisma.exportJob.findUnique.mockResolvedValue(buildExportJob(tenantFeature, clinicSetting));

      await processor.handleProcessExport({ data: { jobId: 'job-1' } } as any);

      expect(exportGateway.dispatchExportCommand).toHaveBeenCalledWith(
        'agent-1',
        expect.objectContaining({ anonymize: expectedAnonymize }),
      );
    },
  );

  it('requires both the tenant plan feature and the clinic setting — neither alone is enough', async () => {
    prisma.exportJob.findUnique.mockResolvedValue(buildExportJob(true, false));

    await processor.handleProcessExport({ data: { jobId: 'job-1' } } as any);

    expect(exportGateway.dispatchExportCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({ anonymize: false }),
    );
  });
});
