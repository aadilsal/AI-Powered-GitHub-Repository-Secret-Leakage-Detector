import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * Extracts a ZIP file into a temporary directory
 * @param fileBuffer - The ZIP file as a Buffer
 * @returns The path where the ZIP was extracted
 */
export async function extractZip(fileBuffer: Buffer): Promise<string> {
  // Generate a random ID for the extraction directory
  const randomId = randomBytes(16).toString('hex');
  const extractPath = path.join(process.cwd(), 'tmp', 'uploads', randomId);

  // Ensure the directory exists
  fs.mkdirSync(extractPath, { recursive: true });

  try {
    console.log(`Extracting ZIP to ${extractPath}...`);
    
    // Create ZIP instance from buffer
    const zip = new AdmZip(fileBuffer);
    
    // Extract all files
    zip.extractAllTo(extractPath, true);
    
    console.log(`Successfully extracted ZIP to ${extractPath}`);
    return extractPath;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    throw new Error(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleans up an extracted ZIP directory
 * @param extractPath - The path to the extracted files
 */
export function cleanupExtract(extractPath: string): void {
  try {
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
      console.log(`Cleaned up extraction at ${extractPath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
