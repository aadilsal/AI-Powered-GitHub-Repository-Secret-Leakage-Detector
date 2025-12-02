export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

function clamp(v: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

export function scoreSecret({ regexMatch, entropy, mlConfidence }: { regexMatch?: string | null; entropy?: number; mlConfidence?: number; }): { score: number; severity: Severity } {
  let base = typeof mlConfidence === 'number' ? mlConfidence : 0;

  console.log(`Scoring secret: regex=${!!regexMatch} entropy=${entropy} mlConfidence=${mlConfidence}`);

  if (regexMatch) base += 0.35;
  if (entropy && entropy > 4.5) base += 0.18;
  else if (entropy && entropy > 3.5) base += 0.09;

  const finalScore = clamp(base, 0, 1);

  let severity: Severity = 'LOW';
  if (finalScore >= 0.85) severity = 'HIGH';
  else if (finalScore >= 0.55) severity = 'MEDIUM';

  console.log(`Final hybrid score=${finalScore} severity=${severity}`);
  return { score: finalScore, severity };
}
