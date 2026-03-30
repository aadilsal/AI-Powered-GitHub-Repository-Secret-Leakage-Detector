import { cloneRepo, cleanupRepo } from './cloneRepo';
import { cleanupExtract, extractZip } from './extractZip';
import { walkFiles } from './walkFiles';
import { detectCandidates } from './detectCandidates';
import type { RepoScanResponse } from '@/types/ScanTypes';

export type ScanJobInput =
  | { kind: 'url'; repoUrl: string }
  | { kind: 'zip'; fileName: string; zipBase64: string };

export async function runScanJob(input: ScanJobInput): Promise<RepoScanResponse> {
  let rootPath: string | null = null;
  let repoLabel: string | undefined;

  try {
    if (input.kind === 'url') {
      repoLabel = input.repoUrl;
      rootPath = await cloneRepo(input.repoUrl);
    } else {
      repoLabel = input.fileName;
      const buf = Buffer.from(input.zipBase64, 'base64');
      rootPath = await extractZip(buf);
    }

    const filePaths = walkFiles(rootPath);
    const findings = await detectCandidates(filePaths);

    const stats: Record<string, number> = { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 };
    for (const f of findings) {
      const t = (f.secretType || '').toLowerCase();
      if (t.includes('aws')) stats.aws += 1;
      else if (t.includes('gh') || t.includes('github')) stats.github_tokens += 1;
      else if (t.includes('jwt')) stats.jwt += 1;
      else if (t.includes('stripe')) stats.stripe += 1;
      else if (t.includes('mongo') || t.includes('postgres') || t.includes('redis') || t.includes('db')) stats.database += 1;
    }

    return {
      repo: repoLabel,
      totalFiles: filePaths.length,
      totalFindings: findings.length,
      findings,
      stats,
    };
  } finally {
    if (rootPath) {
      try {
        if (input.kind === 'url') await cleanupRepo(rootPath);
        else await cleanupExtract(rootPath);
      } catch {
        // best-effort cleanup
      }
    }
  }
}

