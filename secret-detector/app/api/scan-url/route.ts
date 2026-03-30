import { NextRequest, NextResponse } from 'next/server';
import { cloneRepo, cleanupRepo } from '@/lib/cloneRepo';
import { walkFiles } from '@/lib/walkFiles';
import { detectCandidates } from '@/lib/detectCandidates';
import { RepoScanRequest } from '@/types';
import { RepoScanResponse } from '@/types/ScanTypes';

export async function POST(request: NextRequest) {
  let clonePath: string | null = null;

  try {
    const body: RepoScanRequest = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json(
        {
          repo: undefined,
          totalFiles: 0,
          totalFindings: 0,
          findings: [],
          stats: { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 },
          error: 'Invalid or missing repoUrl',
        },
        { status: 400 }
      );
    }

    console.log(`Starting scan for repository request`);

    clonePath = await cloneRepo(repoUrl);

    console.log('Walking through files...');
    const filePaths = walkFiles(clonePath);
    console.log(`Found ${filePaths.length} files to scan`);

    console.log('Detecting secret candidates...');
    const findings = await detectCandidates(filePaths);
    console.log(`Found ${findings.length} potential secret candidates`);

    if (clonePath) {
      await cleanupRepo(clonePath);
    }


    const stats: Record<string, number> = { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 };
    for (const f of findings) {
      const t = (f.secretType || '').toLowerCase();
      if (t.includes('aws')) stats.aws += 1;
      else if (t.includes('gh') || t.includes('github')) stats.github_tokens += 1;
      else if (t.includes('jwt')) stats.jwt += 1;
      else if (t.includes('stripe')) stats.stripe += 1;
      else if (t.includes('mongo') || t.includes('postgres') || t.includes('redis') || t.includes('db')) stats.database += 1;
    }

    const result: RepoScanResponse = {
      repo: repoUrl,
      totalFiles: filePaths.length,
      totalFindings: findings.length,
      findings,
      stats,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (clonePath) {
      await cleanupRepo(clonePath);
    }

    console.error('Scan error:', error);

    const result = {
      repo: undefined,
      totalFiles: 0,
      totalFindings: 0,
      findings: [],
      stats: { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(result, { status: 500 });
  }
}
