import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { spawn, ChildProcess } from 'child_process';


export async function cloneRepo(repoUrl: string): Promise<string> {
  const randomId = randomBytes(16).toString('hex');
  const clonePath = path.join(process.cwd(), 'tmp', 'scanner', randomId);


  fs.mkdirSync(clonePath, { recursive: true });

  try {
    const git = simpleGit();
    console.log(`Cloning ${repoUrl} into ${clonePath}...`);


    if (!repoUrl.startsWith('http') && !repoUrl.includes('github.com') && !repoUrl.includes('gitlab.com') && !repoUrl.includes('bitbucket.org')) {
      throw new Error('Invalid repository URL');
    }


    // Use a spawned git process so we can kill it on timeout and avoid lingering handles
    const timeoutMs = 3 * 60_000; // 3 minutes
    const clonePromise = new Promise<void>((resolve, reject) => {
      let finished = false;
      let proc: ChildProcess | null = null;
      try {
        proc = spawn('git', ['clone', '--depth', '1', repoUrl, clonePath], { stdio: 'inherit' });
      } catch (err) {
        return reject(err);
      }

      let timer: NodeJS.Timeout | null = null;
      const onFinish = (err?: Error | null) => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        if (err) return reject(err);
        resolve();
      };

      proc.on('error', (err) => onFinish(err as Error));
      proc.on('close', (code) => {
        if (code === 0) onFinish(null);
        else onFinish(new Error(`git clone exited with code ${code}`));
      });

      // Timeout handler kills the git process to allow cleanup
      timer = setTimeout(() => {
        if (!finished && proc) {
          try { proc.kill('SIGKILL'); } catch (e) {}
        }
        if (!finished) onFinish(new Error('Clone timeout'));
      }, timeoutMs);
    });

    await clonePromise;

    console.log(`Successfully cloned repository to ${clonePath}`);


    const dirSize = (dir: string): number => {
      let total = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        try {
          if (e.isDirectory()) total += dirSize(p);
          else total += fs.statSync(p).size || 0;
        } catch (err) {}
      }
      return total;
    };

    try {
      const sizeBytes = dirSize(clonePath);
      const maxBytes = 300 * 1024 * 1024; // 300MB
      console.log(`Cloned repo size (bytes): ${sizeBytes}`);
      if (sizeBytes > maxBytes) {
        // use async cleanup helper to be resilient on Windows
        await cleanupRepo(clonePath);
        throw new Error('Repository too large (>300MB)');
      }
    } catch (e: unknown) {
      if (fs.existsSync(clonePath)) await cleanupRepo(clonePath);
      throw e;
    }

    return clonePath;
  } catch (error: unknown) {
    if (fs.existsSync(clonePath)) {
      await cleanupRepo(clonePath);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to clone repository: ${message}`);
  }
}


export async function cleanupRepo(clonePath: string): Promise<void> {
  // Try removing up to several times to handle Windows file locks (EBUSY/EPERM)
  const maxAttempts = 6;
  const baseDelay = 150; // ms

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (fs.existsSync(clonePath)) {
        // prefer rmSync for simplicity but allow retries
        fs.rmSync(clonePath, { recursive: true, force: true });
      }
      console.log(`Cleaned up repository at ${clonePath}`);
      return;
    } catch (error: any) {
      const code = error && error.code ? error.code : null;
      // If it's a transient Windows lock, wait and retry
      if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
        const delay = baseDelay * attempt;
        console.warn(`cleanupRepo attempt ${attempt} failed with ${code}, retrying in ${delay}ms`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      console.error(`Failed to cleanup repository: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }
  console.error(`cleanupRepo: unable to remove ${clonePath} after ${maxAttempts} attempts, attempting platform-specific fallback`);
  try {
    if (process.platform === 'win32') {
      // use cmd rmdir
      await execAsync(`cmd /c rmdir /s /q "${clonePath}"`);
    } else {
      await execAsync(`rm -rf "${clonePath}"`);
    }
    console.log(`cleanupRepo: platform fallback succeeded for ${clonePath}`);
  } catch (err) {
    console.error(`cleanupRepo: platform fallback failed for ${clonePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
