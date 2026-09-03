import { Ratelimit, Valkey } from '@devhuset-oss/ratelimit';

const valkeyUrl = process.env.VALKEY_URL;
if (!valkeyUrl) throw new Error('VALKEY_URL is not set');

export const valkey = new Valkey(valkeyUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });

export const ratelimiter = new Ratelimit(
	valkey,
	Ratelimit.slidingWindow({
		limit: 5,
		window: 60
	})
);

export function closeValkey() {
	(valkey as Valkey & { disconnect(): void }).disconnect();
}
