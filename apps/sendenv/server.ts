import { assets } from './app/assets.ts';
import { router } from './app/router.ts';

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? '0.0.0.0';

const server = Bun.serve({
	hostname,
	port,
	async fetch(request) {
		try {
			return await router.fetch(request);
		} catch (error) {
			console.error('Unhandled Sendenv error:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}
});

console.log(`Sendenv listening on http://${hostname}:${server.port}`);

let shuttingDown = false;
async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;
	await server.stop();
	await assets.close();
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
