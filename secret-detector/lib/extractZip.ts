import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export async function extractZip(fileBuffer: Buffer): Promise<string> {
  const randomId = randomBytes(16).toString('hex');
  const extractPath = path.join(process.cwd(), 'tmp', 'uploads', randomId);
  const root = path.resolve(extractPath);

  fs.mkdirSync(extractPath, { recursive: true });

  try {
    console.log(`Extracting ZIP to ${extractPath}...`);
    
    const zip = new AdmZip(fileBuffer);

    const entries = zip.getEntries();
    const maxEntries = 10000;
    const maxFileBytes = 50 * 1024 * 1024;
    const maxTotalBytes = 200 * 1024 * 1024;
    if (entries.length > maxEntries) throw new Error('ZIP archive has too many entries');

    let totalBytes = 0;
    for (const e of entries) {
      if (e.header && e.header.size && e.header.size > maxFileBytes) {
        throw new Error('ZIP contains a too-large file');
      }
      if (e.header && typeof e.header.size === 'number') {
        totalBytes += e.header.size;
        if (totalBytes > maxTotalBytes) throw new Error('ZIP uncompressed size exceeds limit');
      }
    }
    
    for (const e of entries) {
      const entryName = (e.entryName || '').replace(/\\/g, '/');
      if (!entryName || entryName.endsWith('/')) continue;

      const destPath = path.resolve(root, entryName);
      const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
      if (destPath !== root && !destPath.startsWith(rootWithSep)) {
        throw new Error('ZIP contains an invalid entry path');
      }

      const dir = path.dirname(destPath);
      fs.mkdirSync(dir, { recursive: true });

      const data = e.getData();
      fs.writeFileSync(destPath, data);
    }
    
    console.log(`Successfully extracted ZIP to ${extractPath}`);
    return extractPath;
  } catch (error) {
    if (fs.existsSync(extractPath)) {
      await cleanupExtract(extractPath);
    }
    throw new Error(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function cleanupExtract(extractPath: string): Promise<void> {
  const maxAttempts = 6;
  const baseDelay = 150;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
      console.log(`Cleaned up extraction at ${extractPath}`);
      return;
    } catch (err: any) {
      const code = err && err.code ? err.code : null;
      if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
        const delay = baseDelay * attempt;
        console.warn(`cleanupExtract attempt ${attempt} failed with ${code}, retrying in ${delay}ms`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      console.error(`Failed to cleanup extraction: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
  }
  try {
    if (process.platform === 'win32') {
      await execAsync(`cmd /c rmdir /s /q "${extractPath}"`);
    } else {
      await execAsync(`rm -rf "${extractPath}"`);
    }
    console.log(`cleanupExtract: platform fallback succeeded for ${extractPath}`);
  } catch (err) {
    console.error(`cleanupExtract: platform fallback failed for ${extractPath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
