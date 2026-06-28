import { registerAs } from '@nestjs/config';

export default registerAs('dicom', () => ({
  aeTitle: process.env.DICOM_AE_TITLE || 'SMARTPACS',
  port: parseInt(process.env.DICOM_SCP_PORT || '104', 10),
  allowedCallingAeTitles: (process.env.DICOM_ALLOWED_AE_TITLES || '').split(',').filter(Boolean),
  maxAssociations: parseInt(process.env.DICOM_MAX_ASSOCIATIONS || '10', 10),
  receiveTimeout: parseInt(process.env.DICOM_RECEIVE_TIMEOUT || '30000', 10),
  storageDirectory: process.env.DICOM_RECEIVED_DIR || './storage/received',
  worklist: {
    enabled: process.env.DICOM_WORKLIST_ENABLED === 'true',
    hisUrl: process.env.DICOM_WORKLIST_HIS_URL || '', // host:port of the HIS/RIS C-FIND SCP
    hisAeTitle: process.env.DICOM_WORKLIST_HIS_AE_TITLE || 'ANY-SCP',
    localPort: parseInt(process.env.DICOM_WORKLIST_LOCAL_PORT || '105', 10),
    dir: process.env.DICOM_WORKLIST_DIR || './storage/worklist',
    cacheMinutes: parseInt(process.env.DICOM_WORKLIST_CACHE_MINUTES || '5', 10),
  },
  orthanc: {
    // When true, a local Orthanc instance replaces storescp as the DICOM
    // C-STORE receiver (same dicom.aeTitle/dicom.port), and received studies
    // are also forwarded to the central cloud Orthanc for OHIF viewing.
    enabled: process.env.DICOM_ORTHANC_ENABLED === 'true',
    executable: process.env.DICOM_ORTHANC_EXECUTABLE || (process.platform === 'win32' ? 'Orthanc.exe' : 'Orthanc'),
    // Loopback-only HTTP port for Orthanc's own REST/DICOMweb API, used
    // internally to poll for new studies and to fetch them for forwarding.
    httpPort: parseInt(process.env.DICOM_ORTHANC_HTTP_PORT || '8043', 10),
    dataDir: process.env.DICOM_ORTHANC_DATA_DIR || './storage/orthanc',
    pollIntervalMs: parseInt(process.env.DICOM_ORTHANC_POLL_INTERVAL_MS || '5000', 10),
  },
}));
