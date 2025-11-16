import { NextRequest, NextResponse } from 'next/server';
import { extractZip, cleanupExtract } from '@/lib/extractZip';
import { walkFiles } from '@/lib/walkFiles';
import { detectCandidates } from '@/lib/detectCandidates';
import { ScanResult } from '@/types';

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
          success: false,
          error: 'No file provided',
          candidates: [],
          filesScanned: 0,
        } as ScanResult,
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only ZIP files are supported',
          candidates: [],
          filesScanned: 0,
        } as ScanResult,
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
    const candidates = detectCandidates(filePaths);
    console.log(`Found ${candidates.length} potential secret candidates`);

    // Clean up extracted files
    if (extractPath) {
      cleanupExtract(extractPath);
    }

    // Return results
    const result: ScanResult = {
      success: true,
      candidates,
      filesScanned: filePaths.length,
      scanPath: file.name,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Clean up on error
    if (extractPath) {
      cleanupExtract(extractPath);
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
