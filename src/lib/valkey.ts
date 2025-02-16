import { env } from '$env/dynamic/private';
import { Ratelimit, Valkey } from '@devhuset-oss/ratelimit';

if (!env.VALKEY_URL) throw new Error('VALKEY_URL is not set');

const valkey = new Valkey(env.VALKEY_URL);

// Create rate limiter (5 requests per 60 seconds)
export const ratelimiter = new Ratelimit(
	valkey,
	Ratelimit.slidingWindow({
		limit: 5, // requests
		window: 60 // seconds
	})
);
