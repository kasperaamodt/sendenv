import { createApi } from './app.ts';
import { checkDatabase, closeDatabase } from './db/index.ts';
import { check_redis, close_redis, rate_limiter } from './infra/redis.ts';
import { secretStore } from './modules/secrets/store.ts';

const parsedProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '0', 10);
const trustedProxyHops =
	Number.isInteger(parsedProxyHops) && parsedProxyHops > 0 ? parsedProxyHops : 0;
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);
const app = createApi({
	store: secretStore,
	rateLimiter: rate_limiter,
	trustedProxyHops,
	allowedOrigins,
	healthCheck: async () => {
		await Promise.all([checkDatabase(), check_redis()]);
	}
});
const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? '0.0.0.0';
let cleanupInFlight: Promise<void> | null = null;

const runCleanup = () => {
	if (cleanupInFlight) return cleanupInFlight;

	cleanupInFlight = secretStore
		.cleanup(new Date())
		.then((deleted) => {
			if (deleted > 0) console.log(`Deleted ${deleted} expired or consumed secrets`);
		})
		.catch((error) => console.error('Secret cleanup failed:', error))
		.finally(() => {
			cleanupInFlight = null;
		});

	return cleanupInFlight;
};

const server = Bun.serve({
	hostname,
	port,
	maxRequestBodySize: 128 * 1024,
	async fetch(request, bunServer) {
		const headers = new Headers(request.headers);
		headers.delete('x-sendenv-remote-address');
		const address = bunServer.requestIP(request)?.address;
		if (address) headers.set('x-sendenv-remote-address', address);

		return app.handle(new Request(request, { headers }));
	}
});

void runCleanup();
const cleanupTimer = setInterval(runCleanup, 10 * 60 * 1000);
console.log(`Sendenv API listening on http://${hostname}:${server.port}`);

let shuttingDown = false;
async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;
	clearInterval(cleanupTimer);
	await server.stop();
	await cleanupInFlight;
	await closeDatabase();
	close_redis();
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
