import { run } from 'remix/ui';

const app = run({
	async loadModule(moduleUrl, exportName) {
		const module = await import(moduleUrl);
		return module[exportName];
	}
});

app.addEventListener('error', (event) => {
	console.error('Remix UI error:', event.error);
});

app.ready().catch((error) => {
	console.error('Hydration failed:', error);
});
