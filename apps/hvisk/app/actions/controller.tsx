import { createController } from 'remix/router';

import { assets } from '../assets.ts';
import { routes } from '../routes.ts';
import { HomePage } from './home-page.tsx';
import { SecretPage } from './secret-page.tsx';

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

		secret(context) {
			return context.render(<SecretPage apiBaseUrl={apiBaseUrl} contentId={context.params.id} />);
		},

		health() {
			return new Response(null, { status: 204 });
		}
	}
});
