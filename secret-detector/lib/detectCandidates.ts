import * as fs from 'fs';
import { isTextFile } from './walkFiles';
import { classifyByRegex } from './classifyByRegex';
import { calculateEntropy } from './entropy';
import { ScanFinding } from '@/types/ScanTypes';

const SUSPICIOUS_VARS = [
  'secret',
  'password',
  'passwd',
  'pwd',
  'token',
  'api',
  'key',
  'auth',
];

const URL_LIKE = /https?:\/\/|www\.|:\/\//i;
const CSS_CLASS = /class=\"[\w\- ]+\"|className=\"[\w\- ]+\"/i;
const HTML_ATTR = /<[^>]+>/;

function extractValue(line: string): string | null {
  // quoted values
  const quoted = line.match(/["'`]([^"'`]{8,})["'`]/);
  if (quoted && quoted[1]) return quoted[1];

  // key = value or key: value
  const assign = line.match(/[=:\s]\s*([A-Za-z0-9\-_.+\/=]{8,})/);
  if (assign && assign[1]) return assign[1];

  return null;
}

// severity scoring is handled by scoreSecret; kept here previously but now unused

export async function detectCandidates(filePaths: string[]): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];

  console.log(`Starting detectCandidates on ${filePaths.length} files`);

  for (const filePath of filePaths) {
    try {
      console.log(`Scanning file: ${filePath}`);
      if (!isTextFile(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      // support multiline for PEM-like files
      const isPem = filePath.toLowerCase().endsWith('.pem') || content.includes('-----BEGIN');
      const lines = isPem ? [content] : content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();

        if (!line) continue;
        if (line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) continue;
        if (URL_LIKE.test(line)) continue; // skip URLs
        if (CSS_CLASS.test(line) || HTML_ATTR.test(line)) continue; // skip markup

        // First, run regex classifier against whole line
        const regexResult = classifyByRegex(line);
        if (regexResult.matched) {
          const matchedText = regexResult.match || line;
          const entropy = calculateEntropy(matchedText);
          console.log(`Regex matched in ${filePath}:${i+1} -> ${regexResult.type} match=${matchedText.slice(0,60)}`);
          // call ML
          console.log('Calling ML for regex match...');
          const ml = await import('./mlClient').then(m => m.predictWithML(matchedText)).catch((err) => {
            console.error('ML call failed:', err?.message || err);
            return { prediction: 0, confidence: 0 };
          });
          console.log(`ML returned confidence=${ml.confidence}`);
          const { score, severity } = await import('./scoreSecret').then(s => s.scoreSecret({ regexMatch: regexResult.match, entropy, mlConfidence: ml.confidence }));
          console.log(`Computed hybrid score=${score} severity=${severity}`);
          const masked = maskSecret(matchedText);
          const finding: ScanFinding = {
            filePath,
            lineNumber: i + 1,
            content: maskContent(line, matchedText),
            entropy,
            regexMatch: regexResult.match,
            secretType: regexResult.type || 'GENERIC',
            mlConfidence: ml.confidence,
            hybridScore: score,
            severity,
          };
          findings.push(finding);
          continue;
        }

        // Try to extract probable token/value from line
        const value = extractValue(line);
        if (!value) continue;

        // Reject long identifiers (like long HTML ids) and obvious false positives
        if (value.length > 200) continue;

        // Quick heuristic: only consider if suspicious var names or keywords present
        const lower = line.toLowerCase();
        const hasSuspiciousName = SUSPICIOUS_VARS.some((v) => lower.includes(v));
        if (!hasSuspiciousName) continue;

        const entropy = calculateEntropy(value);
        if (entropy <= 3.5) continue; // skip low entropy

        // call ML for non-regex candidates as well
        console.log(`Heuristic candidate in ${filePath}:${i+1} value=${value.slice(0,60)} entropy=${entropy}`);
        console.log('Calling ML for heuristic candidate...');
        const ml = await import('./mlClient').then(m => m.predictWithML(value)).catch((err) => {
          console.error('ML call failed:', err?.message || err);
          return { prediction: 0, confidence: 0 };
        });
        console.log(`ML returned confidence=${ml.confidence}`);
        const { score, severity } = await import('./scoreSecret').then(s => s.scoreSecret({ regexMatch: undefined, entropy, mlConfidence: ml.confidence }));
        console.log(`Computed hybrid score=${score} severity=${severity}`);
        const masked = maskSecret(value);
        const finding: ScanFinding = {
          filePath,
          lineNumber: i + 1,
          content: maskContent(line, value),
          entropy,
          secretType: 'GENERIC',
          mlConfidence: ml.confidence,
          hybridScore: score,
          severity,
        };

        findings.push(finding);
      }
    } catch (err) {
      console.error(`Error scanning file ${filePath}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  // helper: mask secret string partially (keep prefix and hide rest)
  function maskSecret(s: string) {
    if (!s) return s;
    if (s.length <= 8) return s[0] + '*'.repeat(Math.max(1, s.length - 2)) + s.slice(-1);
    const keep = 4;
    return s.slice(0, keep) + '****' + s.slice(-keep);
  }

  function escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function maskContent(line: string, secret: string) {
    try {
      const esc = escapeHtml(line);
      const s = escapeHtml(secret);
      const masked = maskSecret(s);
      return esc.split(s).join(masked);
    } catch (e) {
      return '***masked***';
    }
  }

  return findings;
}
