import type { UUID, ISODateString } from './common';

export interface DicomMetadata {
  // Patient
  patientId?: string;
  patientName?: string;
  patientBirthDate?: string;
  patientSex?: DicomSex;
  patientAge?: string;
  patientWeight?: number;

  // Study
  studyInstanceUid: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  accessionNumber?: string;
  referringPhysicianName?: string;

  // Series
  seriesInstanceUid?: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality: DicomModality;
  bodyPartExamined?: string;
  laterality?: string;

  // Image/SOP
  sopInstanceUid?: string;
  sopClassUid?: string;
  instanceNumber?: number;
  numberOfFrames?: number;
  imageType?: string[];
  rows?: number;
  columns?: number;
  pixelSpacing?: [number, number];
  sliceThickness?: number;
  transferSyntaxUid?: string;

  // Equipment
  manufacturer?: string;
  manufacturerModelName?: string;
  stationName?: string;
  institutionName?: string;
  institutionAddress?: string;

  // Ultrasound specific
  frameRate?: number;
  heartRate?: number;
  imagingFrequency?: number;
  depthOfScanField?: number;
}

export type DicomSex = 'M' | 'F' | 'O';

export type DicomModality =
  | 'US'   // Ultrasound
  | 'CT'   // Computed Tomography
  | 'MR'   // Magnetic Resonance
  | 'XR'   // X-Ray
  | 'CR'   // Computed Radiography
  | 'DR'   // Digital Radiography
  | 'NM'   // Nuclear Medicine
  | 'PET'  // Positron Emission Tomography
  | 'MG'   // Mammography
  | 'RF'   // Radio Fluoroscopy
  | 'OT';  // Other

export interface DicomFile {
  id: UUID;
  studyId: UUID;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  metadata: DicomMetadata;
  isVideo: boolean;
  frameCount?: number;
  thumbnailPath?: string;
  createdAt: ISODateString;
}

export interface DicomStudyTree {
  studyInstanceUid: string;
  series: DicomSeries[];
  totalFiles: number;
  totalSize: number;
}

export interface DicomSeries {
  seriesInstanceUid: string;
  seriesNumber: number;
  modality: DicomModality;
  description?: string;
  instances: DicomInstance[];
}

export interface DicomInstance {
  sopInstanceUid: string;
  instanceNumber: number;
  fileName: string;
  fileSize: number;
  isVideo: boolean;
  thumbnailUrl?: string;
}

export interface CStoreRequest {
  callingAeTitle: string;
  calledAeTitle: string;
  remoteHost: string;
  remotePort: number;
  sopClassUid: string;
  sopInstanceUid: string;
  dataset: DicomMetadata;
  filePath: string;
}

export interface WorklistItem {
  patientId: string;
  patientName: string;
  patientBirthDate?: string;
  patientSex?: DicomSex;
  studyDate: string;
  studyTime?: string;
  accessionNumber: string;
  modality: DicomModality;
  scheduledProcedureDescription?: string;
  scheduledStationAeTitle?: string;
  requestedProcedureId?: string;
}
