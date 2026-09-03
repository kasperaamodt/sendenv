import { defineConfig } from 'drizzle-kit';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './app/lib/db/schema.ts',
	dbCredentials: {
		url: process.env.DATABASE_URL
	},
	verbose: true,
	strict: true,
	dialect: 'mysql'
});
