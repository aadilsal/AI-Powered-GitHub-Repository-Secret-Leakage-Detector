import { SECRET_PATTERNS } from './regexPatterns';

export interface ClassificationResult {
  matched: boolean;
  type?: string;
  match?: string;
}

/**
 * Run the input string against all secret patterns and return the first match
 */
export function classifyByRegex(input: string): ClassificationResult {
  if (!input || typeof input !== 'string') return { matched: false };

  for (const [key, pattern] of Object.entries(SECRET_PATTERNS)) {
    try {
      const m = input.match(pattern as RegExp);
      if (m && m.length > 0) {
        return { matched: true, type: key, match: m[0] };
      }
    } catch {
      // ignore invalid regexes or matching errors
      continue;
    }
  }

  return { matched: false };
}
