import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const SCAN_QUEUE_NAME = 'scan-jobs';

export function getQueue() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is required for async scan jobs');
  }
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  return new Queue(SCAN_QUEUE_NAME, { connection });
}

