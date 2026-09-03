import { Ratelimit, Valkey as RedisClient } from '@devhuset-oss/ratelimit';

const redis_url = process.env.REDIS_URL;
if (!redis_url) throw new Error('REDIS_URL is not set');

export const redis = new RedisClient(redis_url, {
	lazyConnect: true,
	maxRetriesPerRequest: 1
});

export const rate_limiter = new Ratelimit(
	redis,
	Ratelimit.slidingWindow({
		limit: 5,
		window: 60
	})
);

export async function check_redis() {
	await (redis as RedisClient & { ping(): Promise<string> }).ping();
}

export function close_redis() {
	(redis as RedisClient & { disconnect(): void }).disconnect();
}
