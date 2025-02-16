import { env } from '$env/dynamic/private';
import { Ratelimit, type ValkeyClient } from '@devhuset-oss/ratelimit';
import { Redis } from 'iovalkey';

if (!env.VALKEY_URL) throw new Error('VALKEY_URL is not set');

const valkey = new Redis(env.VALKEY_URL) as ValkeyClient;

// Create rate limiter (5 requests per 60 seconds)
export const ratelimiter = new Ratelimit(
	valkey,
	Ratelimit.slidingWindow({
		limit: 5, // requests
		window: 60 // seconds
	})
);
