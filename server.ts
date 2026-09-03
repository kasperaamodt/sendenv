import { assets } from './app/assets.ts';
import { closeDatabase } from './app/lib/db/index.ts';
import { secretStore } from './app/lib/secret-store.ts';
import { closeValkey } from './app/lib/valkey.ts';
import { router } from './app/router.ts';

const cleanupIntervalMs = 10 * 60 * 1000;
const port = Number.parseInt(Bun.env.PORT ?? '3000', 10);
const hostname = Bun.env.HOST ?? '0.0.0.0';

const server = Bun.serve({
	hostname,
	port,
	maxRequestBodySize: 128 * 1024,
	async fetch(request, server) {
		try {
			const headers = new Headers(request.headers);
			const clientAddress = server.requestIP(request)?.address;

			headers.delete('x-sendenv-remote-address');
			if (clientAddress) headers.set('x-sendenv-remote-address', clientAddress);

			return await router.fetch(new Request(request, { headers }));
		} catch (error) {
			if (!(request.signal.aborted && error === request.signal.reason)) {
				console.error(error);
			}

			return new Response('Internal Server Error', { status: 500 });
		}
	}
});

console.log(`Sendenv listening on ${server.url}`);

let cleanupPromise: Promise<void> | null = null;
let shuttingDown = false;

const cleanupInterval = setInterval(runCleanup, cleanupIntervalMs);
runCleanup();

function runCleanup() {
	if (cleanupPromise) return;

	cleanupPromise = secretStore
		.cleanup(new Date())
		.then(() => undefined)
		.catch((error) => console.error('Secret cleanup failed:', error))
		.finally(() => {
			cleanupPromise = null;
		});
}

async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;

	clearInterval(cleanupInterval);
	await server.stop();
	await cleanupPromise;
	await closeDatabase();
	closeValkey();
	await assets.close();
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
