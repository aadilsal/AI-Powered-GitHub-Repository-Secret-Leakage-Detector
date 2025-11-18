import { NextRequest, NextResponse } from 'next/server';
import { predictWithML } from '@/lib/mlClient';
import { calculateEntropy } from '@/lib/entropy';
import { classifyByRegex } from '@/lib/classifyByRegex';
import { scoreSecret } from '@/lib/scoreSecret';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body?.text;
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const regex = classifyByRegex(text);
    const entropy = calculateEntropy(text);
    const ml = await predictWithML(text);
    const { score, severity } = scoreSecret({ regexMatch: regex.match, entropy, mlConfidence: ml.confidence });

    return NextResponse.json({ regex, entropy, ml, score, severity }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
  }
}
