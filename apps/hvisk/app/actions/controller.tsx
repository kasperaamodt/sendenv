import { createController } from 'remix/router';

import { assets } from '../assets.ts';
import { routes } from '../routes.ts';
import { HomePage } from './home-page.tsx';
import { SecretPage } from './secret-page.tsx';

const secret_headers = {
	'Cache-Control': 'no-store',
	'X-Robots-Tag': 'noindex, nofollow, noarchive'
};

const apiBaseUrl =
	process.env.API_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
if (!apiBaseUrl) throw new Error('API_URL is not set');

export default createController(routes, {
	actions: {
		async assets({ request }) {
			return (await assets.fetch(request)) ?? new Response('Not Found', { status: 404 });
		},

		home(context) {
			return context.render(<HomePage apiBaseUrl={apiBaseUrl} />);
		},

		home_head() {
			return new Response(null, { status: 200 });
		},

		async secret(context) {
			const response = await context.render(
				<SecretPage apiBaseUrl={apiBaseUrl} contentId={context.params.id} />
			);
			for (const [name, value] of Object.entries(secret_headers)) response.headers.set(name, value);
			return response;
		},

		secret_head() {
			return new Response(null, { status: 200, headers: secret_headers });
		},

		health() {
			return new Response(null, { status: 204 });
		}
	}
});
