import { NextResponse, type NextRequest } from 'next/server';
import { SCAN_QUEUE_NAME } from '@/lib/queue';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, ctx: { params: { scanId: string } }) {
  const scanId = ctx?.params?.scanId;
  if (!scanId) return NextResponse.json({ error: 'scanId is required' }, { status: 400 });

  const url = process.env.REDIS_URL;
  if (!url) return NextResponse.json({ error: 'REDIS_URL is not configured' }, { status: 500 });

  const { Queue, Job } = await import('bullmq');
  const IORedis = (await import('ioredis')).default;
  const connection = new IORedis(url, { maxRetriesPerRequest: 1 });
  try {
    const queue = new Queue(SCAN_QUEUE_NAME, { connection });
    const job = await Job.fromId(queue, scanId);
    if (!job) return NextResponse.json({ error: 'scan not found' }, { status: 404 });

    const state = await job.getState();
    if (state === 'completed') {
      const result = await job.returnvalue;
      return NextResponse.json({ scanId, status: 'completed', result }, { status: 200 });
    }
    if (state === 'failed') {
      return NextResponse.json({ scanId, status: 'failed', error: job.failedReason || 'failed' }, { status: 200 });
    }
    return NextResponse.json({ scanId, status: state }, { status: 200 });
  } catch (e: any) {
    console.error('scans: get failed', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to fetch scan' }, { status: 500 });
  } finally {
    try {
      await connection.quit();
    } catch {}
  }
}

