import { NextResponse, type NextRequest } from 'next/server';
import { getQueue } from '@/lib/queue';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const kind = (body?.kind || '').toString();
    const queue = getQueue();

    if (kind === 'url') {
      const repoUrl = (body?.repoUrl || '').toString();
      if (!repoUrl) return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 });

      const job = await queue.add('scan-url', { kind: 'url', repoUrl }, { removeOnComplete: { count: 1000 }, removeOnFail: { count: 1000 } });
      return NextResponse.json({ scanId: job.id, status: 'queued' }, { status: 202 });
    }

    if (kind === 'zip') {
      const fileName = (body?.fileName || 'upload.zip').toString();
      const zipBase64 = (body?.zipBase64 || '').toString();
      if (!zipBase64) return NextResponse.json({ error: 'zipBase64 is required' }, { status: 400 });

      const job = await queue.add('scan-zip', { kind: 'zip', fileName, zipBase64 }, { removeOnComplete: { count: 1000 }, removeOnFail: { count: 1000 } });
      return NextResponse.json({ scanId: job.id, status: 'queued' }, { status: 202 });
    }

    return NextResponse.json({ error: "kind must be 'url' or 'zip'" }, { status: 400 });
  } catch (e: any) {
    console.error('scans: create failed', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to create scan' }, { status: 500 });
  }
}

