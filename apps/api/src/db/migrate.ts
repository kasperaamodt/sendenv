import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/mysql2/migrator';
import { createConnection, type RowDataPacket } from 'mysql2/promise';

import { closeDatabase, db } from './index.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const lockConnection = await createConnection(databaseUrl);
const lockName = 'sendenv:database-migrations';

try {
	const [locks] = await lockConnection.query<Array<RowDataPacket & { acquired: number }>>(
		'SELECT GET_LOCK(?, 60) AS acquired',
		[lockName]
	);
	const lock = locks[0];
	if (lock?.acquired !== 1) throw new Error('Could not acquire the database migration lock');

	await migrate(db, {
		migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url))
	});
} finally {
	await lockConnection.query('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => undefined);
	await lockConnection.end();
	await closeDatabase();
}
