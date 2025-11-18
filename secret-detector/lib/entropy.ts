/**
 * Shannon entropy calculation utilities
 */

export function calculateEntropy(input: string): number {
  if (!input || input.length === 0) return 0;

  // For very long strings limit the sample to keep cost reasonable
  const s = input.length > 5000 ? input.slice(0, 5000) : input;
  const len = s.length;
  const freq: Record<string, number> = {};

  for (let i = 0; i < len; i++) {
    const ch = s[i];
    freq[ch] = (freq[ch] || 0) + 1;
  }

  let entropy = 0;
  for (const k in freq) {
    const p = freq[k] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

export function isHighEntropy(input: string, threshold = 3.5): boolean {
  const entropy = calculateEntropy(input);
  return entropy > threshold;
}
