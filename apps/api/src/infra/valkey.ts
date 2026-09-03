import { Ratelimit, Valkey } from '@devhuset-oss/ratelimit';

const valkeyUrl = process.env.VALKEY_URL;
if (!valkeyUrl) throw new Error('VALKEY_URL is not set');

export const valkey = new Valkey(valkeyUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });

export const rateLimiter = new Ratelimit(
	valkey,
	Ratelimit.slidingWindow({
		limit: 5,
		window: 60
	})
);

export async function checkValkey() {
	await (valkey as Valkey & { ping(): Promise<string> }).ping();
}

export function closeValkey() {
	(valkey as Valkey & { disconnect(): void }).disconnect();
}
