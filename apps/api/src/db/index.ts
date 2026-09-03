import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const pool = createPool(databaseUrl);

export const db = drizzle(pool);

export async function checkDatabase() {
	await pool.query('SELECT 1');
}

export async function closeDatabase() {
	await pool.end();
}
