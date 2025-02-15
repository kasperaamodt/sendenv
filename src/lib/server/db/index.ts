import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { Client } from '@planetscale/database';
import { env } from '$env/dynamic/private';
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = new Client({ url: env.DATABASE_URL });
export const db = drizzle(client);
