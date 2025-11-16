import { NextRequest, NextResponse } from 'next/server';
import { cloneRepo, cleanupRepo } from '@/lib/cloneRepo';
import { walkFiles } from '@/lib/walkFiles';
import { detectCandidates } from '@/lib/detectCandidates';
import { ScanResult, RepoScanRequest } from '@/types';

export async function POST(request: NextRequest) {
  let clonePath: string | null = null;

  try {
    // Parse request body
    const body: RepoScanRequest = await request.json();
    const { repoUrl } = body;

    // Validate input
    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing repoUrl',
          candidates: [],
          filesScanned: 0,
        } as ScanResult,
        { status: 400 }
      );
    }

    // Validate GitHub URL
    if (!repoUrl.includes('github.com') && !repoUrl.includes('gitlab.com') && !repoUrl.includes('bitbucket.org')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only GitHub, GitLab, and Bitbucket URLs are supported',
          candidates: [],
          filesScanned: 0,
        } as ScanResult,
        { status: 400 }
      );
    }

    console.log(`Starting scan for repository: ${repoUrl}`);

    // Clone the repository
    clonePath = await cloneRepo(repoUrl);

    // Walk through files
    console.log('Walking through files...');
    const filePaths = walkFiles(clonePath);
    console.log(`Found ${filePaths.length} files to scan`);

    // Detect secret candidates
    console.log('Detecting secret candidates...');
    const candidates = detectCandidates(filePaths);
    console.log(`Found ${candidates.length} potential secret candidates`);

    // Clean up cloned repository
    if (clonePath) {
      cleanupRepo(clonePath);
    }

    // Return results
    const result: ScanResult = {
      success: true,
      candidates,
      filesScanned: filePaths.length,
      scanPath: repoUrl,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Clean up on error
    if (clonePath) {
      cleanupRepo(clonePath);
    }

    console.error('Scan error:', error);

    const result: ScanResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      candidates: [],
      filesScanned: 0,
    };

    return NextResponse.json(result, { status: 500 });
  }
}
