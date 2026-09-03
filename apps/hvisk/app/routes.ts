import { get, head, route } from 'remix/routes';

export const routes = route({
	assets: get('/assets/*path'),
	home: get('/'),
	home_head: head('/'),
	secret: get('/s/:id'),
	secret_head: head('/s/:id'),
	health: get('/health')
});
