import { createController } from 'remix/router';

import { createSecretsApi } from '../lib/secrets-api.ts';
import { secretStore } from '../lib/secret-store.ts';
import { ratelimiter } from '../lib/valkey.ts';
import { assets } from '../assets.ts';
import { routes } from '../routes.ts';
import { HomePage } from './home-page.tsx';
import { SecretPage } from './secret-page.tsx';

const parsedProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '0', 10);
const trustedProxyHops =
	Number.isInteger(parsedProxyHops) && parsedProxyHops > 0 ? parsedProxyHops : 0;
const secretsApi = createSecretsApi({
	store: secretStore,
	rateLimiter: ratelimiter,
	trustedProxyHops
});

export default createController(routes, {
	actions: {
		async assets({ request }) {
			return (await assets.fetch(request)) ?? new Response('Not Found', { status: 404 });
		},

		home(context) {
			return context.render(<HomePage />);
		},

		secret(context) {
			return context.render(<SecretPage contentId={context.params.id} />);
		},

		apiHealth() {
			return new Response(null, { status: 204 });
		},

		apiSecretsCreate({ request }) {
			return secretsApi.create(request);
		},

		apiSecretConsume({ params, request }) {
			return secretsApi.consume(request, params.id);
		}
	}
});
