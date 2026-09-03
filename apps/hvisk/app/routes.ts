import { get, route } from 'remix/routes';

export const routes = route({
	assets: get('/assets/*path'),
	home: get('/'),
	secret: get('/s/:id'),
	health: get('/health')
});
