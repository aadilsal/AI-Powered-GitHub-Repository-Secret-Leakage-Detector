import IORedis, { Redis } from 'ioredis';

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (_redis) return _redis;

  _redis = new IORedis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  _redis.on('error', (err) => {
    console.warn('redis: client error', err?.message || err);
  });

  return _redis;
}

