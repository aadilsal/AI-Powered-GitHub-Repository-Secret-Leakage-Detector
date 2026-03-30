import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SCAN_QUEUE_NAME } from '@/lib/queue';
import { runScanJob, type ScanJobInput } from '@/lib/scanJob';

async function main() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error('scanWorker: missing REDIS_URL');
    process.exit(1);
  }

  const connection = new IORedis(url, { maxRetriesPerRequest: null });

  const worker = new Worker<ScanJobInput, any>(
    SCAN_QUEUE_NAME,
    async (job) => {
      const result = await runScanJob(job.data);
      return result;
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`scanWorker: job completed id=${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`scanWorker: job failed id=${job?.id}`, err?.message || err);
  });
}

main().catch((e) => {
  console.error('scanWorker: fatal', e?.message || e);
  process.exit(1);
});

