export interface Candidate {
  filePath: string;
  lineNumber: number;
  candidateString: string;
  reason?: string;
}

export interface ScanResult {
  success: boolean;
  candidates: Candidate[];
  filesScanned: number;
  scanPath?: string;
  error?: string;
}

export interface RepoScanRequest {
  repoUrl: string;
}

export interface UploadScanRequest {
  file: File | Buffer;
}
