import { get, post, route } from 'remix/routes';

export const routes = route({
	assets: get('/assets/*path'),
	home: get('/'),
	secret: get('/s/:id'),
	apiHealth: get('/api/health'),
	apiSecretsCreate: post('/api/secrets'),
	apiSecretConsume: post('/api/secrets/:id')
});
