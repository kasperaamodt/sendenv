import { createAssetServer } from 'remix/assets';
import path from 'node:path';

const isDevelopment = process.env.NODE_ENV === 'development';
const workspaceRoot = path.resolve(import.meta.dir, '../../..');
const appRoot = 'apps/hvisk/app';

export const assets = createAssetServer({
	basePath: '/assets',
	rootDir: workspaceRoot,
	mounts: {
		app: appRoot,
		npm: 'node_modules',
		sdk: 'packages/sdk',
		'web-ui': 'packages/web-ui'
	},
	allowFiles: [`${appRoot}/routes.ts`, `${appRoot}/actions/public/**`, 'packages/web-ui/src/**'],
	allowPackages: ['remix', '@sendenv/sdk', '@sendenv/web-ui'],
	denyFiles: [`${appRoot}/**/*.test.*`, 'packages/**/*.test.*'],
	sourceMaps: isDevelopment ? 'external' : undefined,
	minify: !isDevelopment,
	watch: isDevelopment
});

const entry = `${appRoot}/actions/public/entry.ts`;
const stylesheet = 'packages/web-ui/src/app.css';

export const entryHref = await assets.getHref(entry);
export const stylesheetHref = await assets.getHref(stylesheet);
