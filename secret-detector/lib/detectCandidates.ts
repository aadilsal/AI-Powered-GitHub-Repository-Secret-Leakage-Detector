import * as fs from 'fs';
import { Candidate } from '@/types';
import { isTextFile } from './walkFiles';

const SECRET_KEYWORDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'access_key',
  'private_key',
  'auth',
  'credentials',
  'key',
];

/**
 * Calculate Shannon entropy of a string
 * Higher entropy often indicates more random/encrypted data (like secrets)
 * @param str
 * @returns
 */
function calculateEntropy(str: string): number {
  const len = str.length;
  const frequencies: { [key: string]: number } = {};

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Calculate entropy
  let entropy = 0;
  for (const char in frequencies) {
    const freq = frequencies[char] / len;
    entropy -= freq * Math.log2(freq);
  }

  return entropy;
}

/**
 * Check if a line contains potential secret indicators
 * @param line
 * @returns
 */
function hasSecretIndicators(line: string): boolean {
  const lowerLine = line.toLowerCase();
  
  // Check for secret keywords
  for (const keyword of SECRET_KEYWORDS) {
    if (lowerLine.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract the potential secret value from a line
 * Looks for patterns like: key="value", key: "value", key=value, etc.
 * @param line 
 * @returns 
 */
function extractValue(line: string): string {
  // Try to extract quoted strings
  const quotedMatch = line.match(/["'`]([^"'`]+)["'`]/);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1];
  }

  // Try to extract value after = or :
  const assignMatch = line.match(/[=:]\s*([^\s;,]+)/);
  if (assignMatch && assignMatch[1]) {
    return assignMatch[1];
  }

  // Return the trimmed line
  return line.trim();
}

/**
 * Detect potential secret candidates in files
 * @param filePaths
 * @returns
 */
export function detectCandidates(filePaths: string[]): Candidate[] {
  const candidates: Candidate[] = [];

  for (const filePath of filePaths) {
    try {
      // Skip non-text files
      if (!isTextFile(filePath)) {
        continue;
      }

      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Scan each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
          continue;
        }

        // Check if line has secret indicators
        if (hasSecretIndicators(line)) {
          const value = extractValue(line);

          // Check if value is long enough and has high entropy
          if (value.length > 20) {
            const entropy = calculateEntropy(value);

            if (entropy > 3.5) {
              candidates.push({
                filePath,
                lineNumber: i + 1,
                candidateString: trimmedLine.substring(0, 200), // Limit to 200 chars
                reason: `High entropy (${entropy.toFixed(2)}) with secret keyword`,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return candidates;
}
