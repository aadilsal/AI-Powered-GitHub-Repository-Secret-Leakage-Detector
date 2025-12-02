import { SECRET_PATTERNS } from './regexPatterns';

export interface ClassificationResult {
  matched: boolean;
  type?: string;
  match?: string;
}

export function classifyByRegex(input: string): ClassificationResult {
  if (!input || typeof input !== 'string') return { matched: false };

  for (const [key, pattern] of Object.entries(SECRET_PATTERNS)) {
    try {
      const m = input.match(pattern as RegExp);
      if (m && m.length > 0) {
        return { matched: true, type: key, match: m[0] };
      }
    } catch {
      continue;
    }
  }

  return { matched: false };
}
