import { NextRequest, NextResponse } from 'next/server';
import { extractZip, cleanupExtract } from '@/lib/extractZip';
import { walkFiles } from '@/lib/walkFiles';
import { detectCandidates } from '@/lib/detectCandidates';
import { RepoScanResponse } from '@/types/ScanTypes';

export async function POST(request: NextRequest) {
  let extractPath: string | null = null;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate input
    if (!file) {
      return NextResponse.json(
        {
          repo: undefined,
          totalFiles: 0,
          totalFindings: 0,
          findings: [],
          stats: { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 },
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        {
          repo: undefined,
          totalFiles: 0,
          totalFindings: 0,
          findings: [],
          stats: { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 },
          error: 'Only ZIP files are supported',
        },
        { status: 400 }
      );
    }

    console.log(`Starting scan for uploaded file: ${file.name}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract the ZIP file
    extractPath = await extractZip(buffer);

    // Walk through files
    console.log('Walking through files...');
    const filePaths = walkFiles(extractPath);
    console.log(`Found ${filePaths.length} files to scan`);

    // Detect secret candidates
    console.log('Detecting secret candidates...');
    const findings = await detectCandidates(filePaths);
    console.log(`Found ${findings.length} potential secret candidates`);

    // Clean up extracted files
    if (extractPath) {
      cleanupExtract(extractPath);
    }

    // Build stats
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
      repo: file.name,
      totalFiles: filePaths.length,
      totalFindings: findings.length,
      findings,
      stats,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Clean up on error
    if (extractPath) {
      cleanupExtract(extractPath);
    }

    console.error('Scan error:', error);

    const result: RepoScanResponse = {
      repo: undefined,
      totalFiles: 0,
      totalFindings: 0,
      findings: [],
      stats: { aws: 0, github_tokens: 0, jwt: 0, stripe: 0, database: 0 },
    };

    return NextResponse.json({ ...result, error: error instanceof Error ? error.message : 'Unknown error occurred' }, { status: 500 });
  }
}
