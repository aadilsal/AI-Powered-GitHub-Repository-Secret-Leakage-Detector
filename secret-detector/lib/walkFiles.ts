import * as fs from 'fs';
import * as path from 'path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.vscode',
  '.idea',
]);

const SKIP_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp',
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv',
  '.mp3', '.wav', '.flac', '.ogg',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
]);

/**
 * Recursively walks through a directory and returns all file paths
 * Skips specified directories and binary/image files
 * @param dirPath 
 * @returns
 */
export function walkFiles(dirPath: string): string[] {
  const files: string[] = [];
  let fileCount = 0;

  function walk(currentPath: string) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (fileCount > 10000) {
          console.warn('walkFiles: reached maximum file limit (10k), stopping traversal');
          return;
        }
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          
          if (!SKIP_EXTENSIONS.has(ext)) {
            // sanitize path
            const normalized = path.normalize(fullPath);
            if (!normalized.startsWith(path.normalize(dirPath))) continue;

            // skip obvious binary files by checking first bytes
            try {
              const fd = fs.openSync(normalized, 'r');
              const buf = Buffer.alloc(8);
              const bytes = fs.readSync(fd, buf, 0, 8, 0);
              fs.closeSync(fd);
              // check for null byte
              if (bytes > 0) {
                let isBinary = false;
                for (let i = 0; i < bytes; i++) if (buf[i] === 0) { isBinary = true; break; }
                if (isBinary) continue;
              }
            } catch (e) {
              // unable to open - skip
              continue;
            }

            files.push(normalized);
            fileCount++;
          }
        }
      }
    } catch (error) {
      console.error(`Error walking directory ${currentPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  walk(dirPath);
  return files;
}

/**
 * Checks if a file is text-based (not binary)
 * @param filePath 
 * @returns 
 */
export function isTextFile(filePath: string): boolean {
  try {
    // Read first 512 bytes
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(512);
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);

    // Check for null bytes 
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error checking file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
