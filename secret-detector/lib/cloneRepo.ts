import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * Clones a GitHub repository into a temporary directory
 * @param repoUrl 
 * @returns 
 */
export async function cloneRepo(repoUrl: string): Promise<string> {
  const randomId = randomBytes(16).toString('hex');
  const clonePath = path.join(process.cwd(), 'tmp', 'scanner', randomId);

  //checking if directory exists
  fs.mkdirSync(clonePath, { recursive: true });

  try {
    const git = simpleGit();
    console.log(`Cloning ${repoUrl} into ${clonePath}...`);
    
    // Clone repository
    await git.clone(repoUrl, clonePath, ['--depth', '1']);
    
    console.log(`Successfully cloned repository to ${clonePath}`);
    return clonePath;
  } catch (error) {
    if (fs.existsSync(clonePath)) {
      fs.rmSync(clonePath, { recursive: true, force: true });
    }
    throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleans up a cloned repository directory
 * @param clonePath 
 */
export function cleanupRepo(clonePath: string): void {
  try {
    if (fs.existsSync(clonePath)) {
      fs.rmSync(clonePath, { recursive: true, force: true });
      console.log(`Cleaned up repository at ${clonePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
