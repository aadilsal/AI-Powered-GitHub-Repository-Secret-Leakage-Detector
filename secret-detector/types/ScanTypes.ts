export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export type SecretType =
  | 'AWS'
  | 'GCP'
  | 'AZURE'
  | 'STRIPE'
  | 'PAYPAL'
  | 'GITHUB'
  | 'GITLAB'
  | 'BITBUCKET'
  | 'JWT'
  | 'DATABASE'
  | 'SSH'
  | 'PEM'
  | 'GENERIC'
  | string;

export interface ScanFinding {
  filePath: string;
  lineNumber: number;
  content: string;
  entropy: number;
  regexMatch?: string;
  secretType?: SecretType;
  mlConfidence?: number;
  hybridScore?: number;
  severity: Severity;
}

export interface RepoScanResponse {
  repo?: string;
  totalFiles: number;
  totalFindings: number;
  findings: ScanFinding[];
  stats: Record<string, number>;
}
