import { createAssetServer } from 'remix/assets';

const isDevelopment = process.env.NODE_ENV === 'development';

export const assets = createAssetServer({
	basePath: '/assets',
	rootDir: process.cwd(),
	allowFiles: ['app/routes.ts', 'app/actions/public/**'],
	allowPackages: ['remix'],
	denyFiles: ['app/**/*.test.*'],
	sourceMaps: isDevelopment ? 'external' : undefined,
	minify: !isDevelopment,
	watch: isDevelopment
});

const entry = 'app/actions/public/entry.ts';
const stylesheet = 'app/actions/public/app.css';

export const entryHref = await assets.getHref(entry);
export const entryPreloads = await assets.getPreloads(entry);
export const stylesheetHref = await assets.getHref(stylesheet);
