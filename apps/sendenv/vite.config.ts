import { sveltekit } from '@sveltejs/kit/vite';
import stylex from '@stylexjs/unplugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit(),
		{
			...(mode === 'test' ? stylex.rollup() : stylex.vite()),
			enforce: undefined
		}
	],
	ssr: {
		noExternal: ['@sendenv/sdk', '@sendenv/web-ui', '@stylexjs/stylex']
	},
	test: {
		env: {
			API_URL: 'http://localhost:3000'
		},
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
}));
